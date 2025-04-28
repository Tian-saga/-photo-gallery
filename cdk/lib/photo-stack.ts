import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';  // 补上这一行
import { Construct } from 'constructs';
import { Storage } from './storage';
import { Messaging } from './messaging';
import { Lambdas } from './lambdas';

export class PhotoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const storage = new Storage(this, 'Storage');
    const messaging = new Messaging(this, 'Messaging');

    new Lambdas(this, 'AllLambdas', {
      bucket: storage.bucket,
      table: storage.table,
      topic: messaging.topic,
      dlq: messaging.dlq
    });

    // 🔥 这两行就是输出
    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: storage.bucket.bucketName,
    });

    new cdk.CfnOutput(this, 'PhotoEventsTopicArn', {
      value: messaging.topic.topicArn,
    });
  }
}
