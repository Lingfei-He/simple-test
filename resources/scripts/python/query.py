import unit_run, inspect, json
import utils
from pathlib import Path

def query_handler(func):
    def handler(*args, **kwargs):
        return func(*args, **kwargs)
    return handler

@query_handler
def find_unit_dirs(root):
    root = Path(root)
    return [str(path) for path in root.iterdir() if unit_run.Unit.valid_path_exists(path)]

@query_handler
def get_unit_info(unit_dir):
    import os
    unit = unit_run.Unit.load_from_disk(unit_dir)
    result = unit.to_info_dict(return_trace=True)
    result['dir_name'] = Path(unit_dir).stem

    msg_path = os.path.join(unit_dir, 'error_trace.obj')
    if result['src_valid']:
        result['src_obj_info']['line'] = inspect.getsourcelines(unit.src_obj)[-1]
        if os.path.exists(msg_path):
            os.remove(msg_path)
    else:
        import pickle, os, traceback
        with open(msg_path, 'wb') as f:
            pickle.dump(result['src_obj_info'], f)
        try:
            raise result['src_obj_info']
        except:
            result['src_obj_info'] = traceback.format_exc()
    return result

@query_handler
def is_meta_valid(unit_path, unit_name):
    return unit_run.Unit.validate_unit(unit_path, unit_name)

@query_handler
def add_empty_unit(unit_path, unit_name, save_dir):
    unit = unit_run.Unit(unit_path, unit_name)
    unit._save(save_dir)
    return 'Add Complete'

@query_handler
def add_empty_param_group(load_dir, param_group_name):
    unit = unit_run.Unit.load_from_disk(load_dir)
    if param_group_name in unit.param_group_map:
        raise NameError(f"Parameter group name '{param_group_name}' exists.")
    param_dict = dict()
    for p in unit.src_obj_info['parameters']:
        param_dict[p['name']] = p['default'] if 'default' in p else p['annotation']
    param_group = unit_run.ParameterGroup(param_dict)
    param_group.save_to_disk(unit_run.ParameterGroup.get_path_by_dir_and_name(load_dir, param_group_name))
    return 'Add Complete'

def find_handler_by_query(query):
    def filter_func(obj, name):
        if inspect.isfunction(obj):
            qualname = obj.__qualname__
            if qualname.split('.')[0] == query_handler.__name__ and name == query:
                return True
        return False

    handlers = unit_run.inspect_by_path(__file__, filter_func, with_name=True)
    if len(handlers) > 0:
        return handlers[0][1]
    else:
        raise LookupError(f"There is no handler for query '{query}'")

# y.__
# print(y.__globals__)
if __name__ == '__main__':
    query, data = utils.get_query_and_data()
    handler = find_handler_by_query(query)
    if type(data) == dict:
        result = handler(**data)
    else:
        result = handler(*data)
    result = {
        'type': 'simple-test',
        'data': result
    }
    utils.return_result(result)
    
    
    # 
    # found_handlers = list(filter(lambda h_name, h_func: h_name == query, handlers))
    # if len(found_handlers) == 0:
    #     raise KeyError(f"There is no handler for query '{query}'")
    # else:
    #     handler = found_handlers[0]
    #     results = data if type(data) == dict 
    #     print(results[0]())
    # print([func.__ for func in handle_funcs])
    # import importlib
    # module = importlib.machinery.SourceFileLoader('_tmp_module', __file__).load_module()
    # print(inspect.getmembers(module))

    # print([(name, obj) for name, obj in inspect.getmembers(__file__) if inspect.isfunction(obj)])


# def query_handler(query):
#     def wrapper(func):
#         def inner_wrapper(*args, **kwargs):
#             query, data = utils.get_query_and_data()
#             return func(*args, **kwargs)
#         return inner_wrapper
#     return wrapper

# handlers = [
#     @query_handler('test')
#     def 
# ]

# def inspect_callables_by_path(path):
#     callables = []
#     sys.path.append(os.path.dirname(path))
#     _tmp_module = importlib.machinery.SourceFileLoader('_tmp_module', path).load_module()
#     for name, obj in inspect.getmembers(_tmp_module):
#         if (inspect.isclass(obj) or inspect.isfunction(obj)) and obj.__module__ == '_tmp_module':
#             callables.append(obj)
#     return callables

# def inspect_callable_infos_by_path(path):
#     result_infos = []
#     for c in inspect_callables_by_path(path):
#         info = {
#             'name': c.__name__,
#             'paramters': []
#         }
#         for p in inspect.signature(c).parameters.values():
#             item = {
#                 'name': p.name,
#                 'annotation': p.annotation
#             }
#             if p.default is not p.empty:
#                 item['default'] = p.default
#             info['paramters'].append(item)
#         result_infos.append(info)
#     print(result_infos)
#     # callable_sigs = [inspect.signature(c) for c in ] 
#     # callable_infos = [{

#     # } for sig in callable_sigs]

# if __name__ == '__main__':
    # path = 'D:/documents/AcademicDocuments/other/pytest-output/simple-test/resources/scripts/python/utils.py'
    # inspect_callable_infos_by_path(path)

    
    # query, data = utils.get_query_and_data()
    # if query == 'inpect_callable_names':
    #     utils.return_result([inspect.signature()])

    # utils.return_result({
    #     'received_query': query,
    #     'received_data': data
    # })
# if __name__ == '__main__':
#     path = 'D:/documents/AcademicDocuments/other/pytest-output/simple-test/src/python/_inspect.py'
#     print(inspect_callables_by_path(path)[0](path))