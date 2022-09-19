import os
import json
from copy import deepcopy

def merge_dict_keeping_order(merged, old, new):

    old_key_list = list(old.keys())
    new_key_list = list(new.keys())

    old_key_iter = iter(old_key_list)
    new_key_iter = iter(new_key_list)

    def next_or_current(iter, current_value):
        try:
            return next(iter), True
        except StopIteration:
            return current_value, False

    is_old_last = False
    is_new_last = False

    old_key, is_old_last = next_or_current(old_key_iter, "")
    new_key, is_new_last = next_or_current(new_key_iter, "")

    last_old_key = old_key
    last_new_key = new_key
    if not is_old_last and not is_new_last:
        pass 
    else:
        while True:
            last_old_key = old_key
            last_new_key = new_key

            increment_old_key = False
            increment_new_key = False
            if old_key == new_key:
                merged[old_key] = old[old_key]
                increment_old_key = True
                increment_new_key = True
            else:
                if old_key in new_key_list:
                    merged[new_key] =  new[new_key]
                    increment_new_key = True
                elif old_key not in new_key_list:
                    merged[old_key] = old[old_key]
                    increment_old_key = True
                elif new_key not in old_key_list:
                    merged[new_key] = new[new_key]
                    increment_new_key = True
            
            if increment_old_key:
                old_key, is_old_last = next_or_current(old_key_iter, old_key)
            if increment_new_key:
                new_key, is_new_last = next_or_current(new_key_iter, new_key)

            if last_old_key == old_key and last_new_key == new_key:
                old_key, is_old_last = next_or_current(old_key_iter, old_key)
                new_key, is_new_last = next_or_current(new_key_iter, new_key)
            if not is_old_last and not is_new_last:
                break

def dummy_openapi_spec(action, schema_type, id, tags=[]):
    if schema_type == 'paths':
        return {
                f"({action}_api_{id})": {
                    "trace": {
                        "tags": tags
                    }
                }
        }
    elif schema_type == 'schemas':
        return {
            f"({action}_schema_{id})": {}
        }

def remove_unchanged(old_json, new_json):
    old_view_json = deepcopy(old_json)
    new_view_json = deepcopy(new_json)

    old_view_json['paths'] = {}
    new_view_json['paths'] = {}
    old_view_json['components']['schemas'] = {}
    new_view_json['components']['schemas'] = {}

    merged_json = deepcopy(old_view_json)

    ''' 
    @dev json 합치기
    '''

    merge_dict_keeping_order(
        merged_json['paths'],
        old_json['paths'],
        new_json['paths']
    )
    merge_dict_keeping_order(
        merged_json['components']['schemas'],
        old_json['components']['schemas'],
        new_json['components']['schemas']
    )
    '''
    @dev 
    '''
            

    with open('merged.json', 'w') as f:
        json.dump(merged_json, f, indent=4)

    '''
    Compare the old and new json with the keys in the 'paths'
    if key is same in both, remove it from both
    if key is different, add dummy value to json that is missing the key, so that the length of both json is same
    '''
    def get_first_key_dict(dict):
        key = list(dict.keys())[0]
        return dict[key]

    id_removed = 1
    id_added = 1

    for key in merged_json['paths']:
        if key in old_json['paths'] and key in new_json['paths']:
            # compare if two dict are same
            if str(old_json['paths'][key]) != str(new_json['paths'][key]):
                old_view_json['paths'][key] = old_json['paths'][key]
                new_view_json['paths'][key] = new_json['paths'][key]            
        # removed
        elif key in old_json['paths']:
            old_view_json['paths'][key] = old_json['paths'][key]
            new_view_json['paths'].update(dummy_openapi_spec('removed', 'paths', id_removed, get_first_key_dict(old_json['paths'][key])['tags']))
            id_removed += 1
        # added
        else:
            new_view_json['paths'][key] = new_json['paths'][key]
            old_view_json['paths'].update(dummy_openapi_spec('added', 'paths', id_added, get_first_key_dict(new_json['paths'][key])['tags']))
            id_added += 1

    id_removed = 1
    id_added = 1

    for key in merged_json['components']['schemas']:
        if key in old_json['components']['schemas'] and key in new_json['components']['schemas']:
            # compare if two dict are same
            if str(old_json['components']['schemas'][key]) != str(new_json['components']['schemas'][key]):
                old_view_json['components']['schemas'][key] = old_json['components']['schemas'][key]
                new_view_json['components']['schemas'][key] = new_json['components']['schemas'][key]            
        # removed
        elif key in old_json['components']['schemas']:
            old_view_json['components']['schemas'][key] = old_json['components']['schemas'][key]
            new_view_json['components']['schemas'].update(dummy_openapi_spec('removed', 'schemas', id_removed))
            id_removed += 1
        # added
        else:
            new_view_json['components']['schemas'][key] = new_json['components']['schemas'][key]
            old_view_json['components']['schemas'].update(dummy_openapi_spec('added', 'schemas', id_added))
            id_added += 1

    '''
    Save view_json to file
    '''

    with open('old_view.json', 'w') as f:
        json.dump(old_view_json, f, indent=4)
    
    with open('new_view.json', 'w') as f:
        json.dump(new_view_json, f, indent=4)
    

current_dir = os.path.dirname(os.path.abspath(__file__))
with open(current_dir + '/utils/openapi_1.json', 'r') as f:
    openapi_1 = json.load(f)
with open(current_dir + '/utils/openapi_2.json', 'r') as f:
    openapi_2 = json.load(f)


remove_unchanged(openapi_1, openapi_2)
