"""Runs agent-written Python read from stdin with best-effort limits.

This is a bounded local guard, not a security sandbox: CPU and file-size rlimits,
network sockets disabled, subprocess/ctypes/pip imports blocked. The Node side adds a
wall-clock timeout and an output cap. Never expose this runner on a public host.
"""
import os
import resource
import socket
import sys
import traceback

CPU_SECONDS = 10
MAX_FILE_BYTES = 5 * 1024 * 1024


def _limit(name, value):
    kind = getattr(resource, name, None)
    if kind is None:
        return
    try:
        resource.setrlimit(kind, (value, value))
    except (ValueError, OSError):
        pass


def _blocked(*args, **kwargs):
    raise OSError("network access is disabled in this runner")


def main():
    _limit("RLIMIT_CPU", CPU_SECONDS)
    _limit("RLIMIT_FSIZE", MAX_FILE_BYTES)
    socket.socket = _blocked
    socket.create_connection = _blocked
    socket.getaddrinfo = _blocked
    os.system = _blocked
    os.popen = _blocked
    for name in ("subprocess", "ctypes", "multiprocessing", "ensurepip", "pip"):
        sys.modules[name] = None  # makes `import <name>` raise ImportError
    code = sys.stdin.read()
    try:
        exec(compile(code, "<agent>", "exec"), {"__name__": "__main__"})
    except SystemExit:
        raise
    except BaseException as exc:
        # tb_next drops main()'s frame; the replace() scrubs this file's absolute path from any
        # remaining frame (e.g. _blocked) so no local path reaches the output or a public fixture.
        lines = traceback.format_exception(type(exc), exc, exc.__traceback__.tb_next)
        sys.stderr.write("".join(lines).replace(__file__, "sandbox.py"))
        sys.exit(1)


if __name__ == "__main__":
    main()
