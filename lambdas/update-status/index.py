import os, json, boto3
ddb = boto3.resource('dynamodb')
table = ddb.Table(os.environ['TABLE'])

def handler(event, _):
    for rec in event['Records']:
        body = json.loads(rec['Sns']['Message'])
        table.update_item(
            Key={'id': body['id']},
            UpdateExpression='SET #s=:s, reason=:r',
            ExpressionAttributeNames={'#s':'status'},
            ExpressionAttributeValues={
                ':s': body['update']['status'],
                ':r': body['update']['reason']
            }
        )
