import os, boto3, json
ddb = boto3.resource('dynamodb')
sns = boto3.client('sns')
table = ddb.Table(os.environ['TABLE'])

def handler(event, _):
    topic_arn = os.environ['TOPIC']
    for rec in event['Records']:
        key = rec['s3']['object']['key']
        if not key.lower().endswith(('.jpeg', '.jpg', '.png')):
            # Instead of raising error, send message to SNS
            sns.publish(
                TopicArn=topic_arn,
                Message=json.dumps({'id': key, 'update': {'status': 'invalid', 'reason': 'Invalid file type'}})
            )
            continue  # Skip putting into table
        table.put_item(Item={'id': key})
