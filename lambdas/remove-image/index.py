import os, json, boto3, logging

ddb    = boto3.resource('dynamodb')
table   = ddb.Table(os.environ['TABLE'])

s3      = boto3.client('s3')
bucket  = os.environ['BUCKET']

log = logging.getLogger()
log.setLevel(logging.INFO)

def _extract_key(payload: dict) -> str:
   
    if 'requestPayload' in payload:       
        return payload['requestPayload']['Records'][0]['s3']['object']['key']
    # 情况 2
    return payload['Records'][0]['s3']['object']['key']

def handler(event, _):
    for rec in event['Records']:
        outer = json.loads(rec['body'])
        key   = _extract_key(outer)

        status = 'error'
        reason = outer.get('responsePayload', {}).get(
            'errorMessage',              
            'bad extension'            
        )

        try:
            s3.delete_object(Bucket=bucket, Key=key)
        except s3.exceptions.NoSuchKey:
            pass

     
        table.update_item(
            Key={'id': key},
            UpdateExpression='SET #s = :s, reason = :r',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': status, ':r': reason}
        )
        log.info('cleaned %s , reason=%s', key, reason)
