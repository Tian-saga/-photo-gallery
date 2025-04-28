import os, boto3
ddb = boto3.resource('dynamodb')
table = ddb.Table(os.environ['TABLE'])

def handler(event, _):
    for rec in event['Records']:
        key = rec['s3']['object']['key']
        if not key.lower().endswith(('.jpeg', '.jpg', '.png')):
            raise ValueError(f'Invalid type: {key}')
        table.put_item(Item={'id': key})
