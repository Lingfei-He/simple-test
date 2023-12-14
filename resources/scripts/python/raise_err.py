import sys, pickle, traceback
if __name__ == '__main__':
    msg_path = sys.argv[1]
    with open(msg_path, 'rb') as f:
        err = pickle.load(f)
        raise BaseException(err)