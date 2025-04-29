import os
import json
import boto3
import logging

ddb = boto3.resource('dynamodb')
sns = boto3.client('sns')
table = ddb.Table(os.environ['TABLE'])
TOPIC = os.environ['TOPIC']

log = logging.getLogger()
log.setLevel(logging.INFO)

def handler(event, _):
    for rec in event['Records']:
        body = json.loads(rec['Sns']['Message'])
        upd  = body['update']
        assert upd['status'] in ('Pass', 'Reject')

    
        resp = table.update_item(
            Key={'id': body['id']},
            UpdateExpression='SET #s = :s, reason = :r, reviewDate = :d',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={
                ':s': upd['status'],
                ':r': upd['reason'],
                ':d': body['date']
            },
            ReturnValues='ALL_NEW'
        )
        attrs = resp['Attributes']
        email = attrs.get('Email')

  
        msg_attrs = {
            'mailer': {
                'DataType': 'String',
                'StringValue': 'true'
            }
        }
        if email:
            msg_attrs['email'] = {
                'DataType': 'String',
                'StringValue': email
            }

    
        sns.publish(
            TopicArn=TOPIC,
            Message=json.dumps(attrs),
            MessageAttributes=msg_attrs
        )
        log.info('status updated & sns published')
