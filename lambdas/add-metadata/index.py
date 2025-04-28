import os, json, boto3
ddb = boto3.resource('dynamodb')
table = ddb.Table(os.environ['TABLE'])

def handler(event, _):
    for rec in event['Records']:
        msg  = json.loads(rec['Sns']['Message'])
        meta = rec['Sns']['MessageAttributes']['metadata_type']['Value']
        table.update_item(
            Key={'id': msg['id']},
            UpdateExpression=f'SET {meta} = :v',
            ExpressionAttributeValues={':v': msg['value']}
        )
