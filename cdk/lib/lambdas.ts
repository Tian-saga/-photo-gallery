import { Construct } from 'constructs';
import * as path from 'path';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as lambdaDest   from 'aws-cdk-lib/aws-lambda-destinations';
import * as s3n          from 'aws-cdk-lib/aws-s3-notifications';
import * as sns          from 'aws-cdk-lib/aws-sns';
import * as snsSubs      from 'aws-cdk-lib/aws-sns-subscriptions';
import { SubscriptionFilter } from 'aws-cdk-lib/aws-sns';
import * as sqs          from 'aws-cdk-lib/aws-sqs';
import * as lambda       from 'aws-cdk-lib/aws-lambda';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam          from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Table  } from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Queue  } from 'aws-cdk-lib/aws-sqs';

interface LambdasProps {
  bucket: Bucket;
  table : Table;
  topic : sns.Topic;
  dlq   : sqs.Queue;
  uploadQ: Queue;
}

export class Lambdas extends Construct {
  constructor(scope: Construct, id: string, props: LambdasProps) {
    super(scope, id);

  
    const common = {
      runtime : lambda.Runtime.PYTHON_3_12,
      timeout : Duration.seconds(15),
      memorySize: 256,
      environment: {
        BUCKET: props.bucket.bucketName,
        TABLE : props.table.tableName,
        TOPIC : props.topic.topicArn,
        MAIL_FROM : 'zhongzitian00@gmail.com'   
      }
    } as const;

    /* -------- Log-Image -------- */
    const logImage = new lambdaPython.PythonFunction(this, 'LogImageFn', {
      entry  : path.join(__dirname, '../../lambdas/log-image'),
      handler: 'handler',
      ...common,
      onFailure: new lambdaDest.SqsDestination(props.dlq),
    });
    props.bucket.grantRead(logImage);
    props.table .grantWriteData(logImage);

    logImage.addEventSource(
        new eventSources.SqsEventSource(props.uploadQ)
      );

    /* -------- Add-Metadata -------- */
    const addMeta = new lambdaPython.PythonFunction(this, 'AddMetadataFn', {
      entry  : path.join(__dirname, '../../lambdas/add-metadata'),
      handler: 'handler',
      ...common,
    });
    props.table.grantWriteData(addMeta);

    /* -------- Update-Status -------- */
    const update = new lambdaPython.PythonFunction(this, 'UpdateStatusFn', {
      entry  : path.join(__dirname, '../../lambdas/update-status'),
      handler: 'handler',
      ...common,
    });
    props.table.grantWriteData(update);

    
    update.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.topic.topicArn],
    }));


    /* -------- Remove-Image -------- */
    const remover = new lambdaPython.PythonFunction(this, 'RemoveImageFn', {
      entry  : path.join(__dirname, '../../lambdas/remove-image'),
      handler: 'handler',
      ...common,
    });
    props.bucket.grantDelete(remover);
    props.dlq  .grantConsumeMessages(remover);
    props.table.grantWriteData(remover);
    remover.addEventSource(new eventSources.SqsEventSource(props.dlq));

    /* -------- Mailer -------- */
    const mailer = new lambdaPython.PythonFunction(this, 'MailerFn', {
      entry  : path.join(__dirname, '../../lambdas/mailer'),
      handler: 'handler',
      ...common,
    });
  
    mailer.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));


    /* S3 → LogImage */
    props.bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,          
        new s3n.SqsDestination(props.uploadQ)
      );

    /* SNS → AddMetadata */
    props.topic.addSubscription(
        new snsSubs.LambdaSubscription(addMeta, {
          filterPolicy: {
            metadata_type: sns.SubscriptionFilter.stringFilter({
                allowlist: ['Caption', 'Date', 'name', 'Email']
            }),
          },
        }),
      );
      
 /* ---------- SNS → UpdateStatus  ---------- */
props.topic.addSubscription(
    new snsSubs.LambdaSubscription(update, {
      filterPolicy: {                                          
        update_msg: sns.SubscriptionFilter.stringFilter({
          allowlist: ['true']                                 
        })
      }
    })
  );
    /* SNS → Mailer（mailer=true）*/
    props.topic.addSubscription(new snsSubs.LambdaSubscription(mailer, {
      filterPolicy: {
        mailer: SubscriptionFilter.stringFilter({ allowlist: ['true'] }),
      },
    }));
  }
}
