import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';
import { Queue, DeadLetterQueue } from 'aws-cdk-lib/aws-sqs';

export class Messaging extends Construct {
  readonly topic: sns.Topic;
  readonly uploadQ: Queue;   
  readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.topic = new sns.Topic(this, 'PhotoEventsTopic');

    this.dlq = new sqs.Queue(this, 'InvalidImageDLQ', {
      retentionPeriod: Duration.days(14)
    });

    this.uploadQ = new Queue(this, 'ImageUploadQ', {
        visibilityTimeout: Duration.seconds(30),
        deadLetterQueue: { maxReceiveCount: 3, queue: this.dlq }
      });

  }
}
