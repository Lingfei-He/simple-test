import sys, json
def get_query_and_data():
    assert len(sys.argv) == 3
    return sys.argv[1], json.loads(sys.argv[2])

def return_result(obj):
    print(json.dumps(obj))


def test(p1, p2, p3, p4:int, p6=None, p7=21323):
    print(p1, p2, p3, p4)

# test(*[1, 2, 3], **{'p4': 4})