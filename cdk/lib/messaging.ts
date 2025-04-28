import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';

export class Messaging extends Construct {
  readonly topic: sns.Topic;
  readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.topic = new sns.Topic(this, 'PhotoEventsTopic');

    this.dlq = new sqs.Queue(this, 'InvalidImageDLQ', {
      retentionPeriod: Duration.days(14)
    });
  }
}
