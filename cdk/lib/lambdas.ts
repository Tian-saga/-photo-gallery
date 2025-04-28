import { Construct } from 'constructs';
import * as path from 'path';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as lambdaDest from 'aws-cdk-lib/aws-lambda-destinations';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';                 
import * as s3 from 'aws-cdk-lib/aws-s3';                         
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions';     
import { FilterOrPolicy, SubscriptionFilter } from 'aws-cdk-lib/aws-sns';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';



interface LambdasProps {
  bucket: Bucket;
  table: Table;
  topic: sns.Topic;
  dlq: sqs.Queue;
}

export class Lambdas extends Construct {
  constructor(scope: Construct, id: string, props: LambdasProps) {
    super(scope, id);

    const common = {
    runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.seconds(15),
      memorySize: 256,
      environment: {
        BUCKET: props.bucket.bucketName,
        TABLE: props.table.tableName,
        TOPIC: props.topic.topicArn
      }
    } as const;

    // LogImage
    const logImage = new lambdaPython.PythonFunction(this, 'LogImageFn', {
      entry: path.join(__dirname, '../../lambdas/log-image'),
      handler: 'handler',
      ...common,
      onFailure: new lambdaDest.SqsDestination(props.dlq)
    });
    props.bucket.grantRead(logImage);
    props.table.grantWriteData(logImage);

    // AddMetadata
    const addMeta = new lambdaPython.PythonFunction(this, 'AddMetadataFn', {
      entry: path.join(__dirname, '../../lambdas/add-metadata'),
      handler: 'handler',
      ...common
    });
    props.table.grantWriteData(addMeta);

    // UpdateStatus
    const update = new lambdaPython.PythonFunction(this, 'UpdateStatusFn', {
      entry: path.join(__dirname, '../../lambdas/update-status'),
      handler: 'handler',
      ...common
    });
    props.table.grantWriteData(update);

    // RemoveImage
    const remover = new lambdaPython.PythonFunction(this, 'RemoveImageFn', {
      entry: path.join(__dirname, '../../lambdas/remove-image'),
      handler: 'handler',
      ...common
    });
    props.bucket.grantDelete(remover);
    props.dlq.grantConsumeMessages(remover);
    remover.addEventSource(new eventSources.SqsEventSource(props.dlq));



    // Mailer 
    new lambdaPython.PythonFunction(this, 'MailerFn', {
      entry: path.join(__dirname, '../../lambdas/mailer'),
      handler: 'handler',
      ...common
    });

    // S3 → LogImage
    props.bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(logImage)
    );

    // SNS → AddMetadata
    props.topic.addSubscription(new snsSubs.LambdaSubscription(addMeta, {
        filterPolicyWithMessageBody: {
            metadata_type: FilterOrPolicy.filter(
              SubscriptionFilter.stringFilter({
                allowlist: ['Caption', 'Date', 'Name']
              })
            )
          }
    }));

    // SNS → UpdateStatus
    props.topic.addSubscription(new snsSubs.LambdaSubscription(update, {
        filterPolicyWithMessageBody: {
            metadata_type: FilterOrPolicy.filter(
              SubscriptionFilter.existsFilter()
            )
          }
    }));
  }
}
