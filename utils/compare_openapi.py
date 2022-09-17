import json
from deepdiff import DeepDiff

# https://www.testcult.com/deep-comparison-of-json-in-python/
def diff_dict(dict_old, dict_new):
    '''
    compare two dict, and make a dict for diff.
    '''
    
    diff = DeepDiff(dict_old, dict_new, ignore_order=True)

    return diff

import os 
if __name__ == '__main__':
    current_dir = os.path.dirname(os.path.abspath(__file__))
    with open(current_dir + '/openapi_1.json', 'r') as f:
        openapi_1 = json.load(f)
    with open(current_dir + '/openapi_2.json', 'r') as f:
        openapi_2 = json.load(f)

    diff = diff_dict(openapi_1, openapi_2)

    with open('diff.json', 'w') as f:
        f.write(diff.to_json())
    
    import dictdiffer, pprint
    result = dictdiffer.diff(openapi_1, openapi_2)
    pprint.pprint(list(result))

