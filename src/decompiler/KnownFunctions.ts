const MAX_GENERATED_NAME_LENGTH = 12;

export interface KnownFunction {
  returnName: string | null;
  params: string[];
}

const KNOWN_FUNCTIONS = new Map<string, KnownFunction>([
  // ─── C Standard Library ───

  // Memory management
  ['malloc', { returnName: 'buf', params: ['size'] }],
  ['calloc', { returnName: 'buf', params: ['count', 'size'] }],
  ['realloc', { returnName: 'buf', params: ['ptr', 'size'] }],
  ['free', { returnName: null, params: ['ptr'] }],
  ['alloca', { returnName: 'buf', params: ['size'] }],
  ['_alloca', { returnName: 'buf', params: ['size'] }],
  ['aligned_alloc', { returnName: 'buf', params: ['alignment', 'size'] }],
  ['posix_memalign', { returnName: 'err', params: ['memptr', 'alignment', 'size'] }],
  ['mmap', { returnName: 'addr', params: ['addr', 'length', 'prot', 'flags', 'fd', 'offset'] }],
  ['munmap', { returnName: 'err', params: ['addr', 'length'] }],
  ['brk', { returnName: 'err', params: ['addr'] }],
  ['sbrk', { returnName: 'prev', params: ['increment'] }],

  // String operations
  ['strlen', { returnName: 'len', params: ['str'] }],
  ['wcslen', { returnName: 'len', params: ['str'] }],
  ['strnlen', { returnName: 'len', params: ['str', 'max'] }],
  ['strcpy', { returnName: 'dst', params: ['dst', 'src'] }],
  ['strncpy', { returnName: 'dst', params: ['dst', 'src', 'n'] }],
  ['strcat', { returnName: 'dst', params: ['dst', 'src'] }],
  ['strncat', { returnName: 'dst', params: ['dst', 'src', 'n'] }],
  ['strcmp', { returnName: 'cmp', params: ['s1', 's2'] }],
  ['strncmp', { returnName: 'cmp', params: ['s1', 's2', 'n'] }],
  ['strcasecmp', { returnName: 'cmp', params: ['s1', 's2'] }],
  ['strncasecmp', { returnName: 'cmp', params: ['s1', 's2', 'n'] }],
  ['strchr', { returnName: 'pos', params: ['str', 'ch'] }],
  ['strrchr', { returnName: 'pos', params: ['str', 'ch'] }],
  ['strstr', { returnName: 'pos', params: ['haystack', 'needle'] }],
  ['strtok', { returnName: 'token', params: ['str', 'delim'] }],
  ['strtok_r', { returnName: 'token', params: ['str', 'delim', 'saveptr'] }],
  ['strdup', { returnName: 'copy', params: ['str'] }],
  ['strndup', { returnName: 'copy', params: ['str', 'n'] }],
  ['strspn', { returnName: 'count', params: ['str', 'accept'] }],
  ['strcspn', { returnName: 'count', params: ['str', 'reject'] }],
  ['strpbrk', { returnName: 'pos', params: ['str', 'accept'] }],
  ['strerror', { returnName: 'msg', params: ['errnum'] }],
  ['strtol', { returnName: 'val', params: ['str', 'endptr', 'base'] }],
  ['strtoul', { returnName: 'val', params: ['str', 'endptr', 'base'] }],
  ['strtoll', { returnName: 'val', params: ['str', 'endptr', 'base'] }],
  ['strtoull', { returnName: 'val', params: ['str', 'endptr', 'base'] }],
  ['strtod', { returnName: 'val', params: ['str', 'endptr'] }],
  ['strtof', { returnName: 'val', params: ['str', 'endptr'] }],
  ['atoi', { returnName: 'val', params: ['str'] }],
  ['atol', { returnName: 'val', params: ['str'] }],
  ['atof', { returnName: 'val', params: ['str'] }],
  ['sprintf', { returnName: 'len', params: ['buf', 'fmt'] }],
  ['snprintf', { returnName: 'len', params: ['buf', 'size', 'fmt'] }],
  ['sscanf', { returnName: 'count', params: ['str', 'fmt'] }],
  ['vsprintf', { returnName: 'len', params: ['buf', 'fmt', 'args'] }],
  ['vsnprintf', { returnName: 'len', params: ['buf', 'size', 'fmt', 'args'] }],

  // Memory operations
  ['memcpy', { returnName: 'dst', params: ['dst', 'src', 'n'] }],
  ['memmove', { returnName: 'dst', params: ['dst', 'src', 'n'] }],
  ['memset', { returnName: 'dst', params: ['dst', 'ch', 'n'] }],
  ['memcmp', { returnName: 'cmp', params: ['s1', 's2', 'n'] }],
  ['memchr', { returnName: 'pos', params: ['str', 'ch', 'n'] }],
  ['bzero', { returnName: null, params: ['str', 'n'] }],
  ['bcopy', { returnName: null, params: ['src', 'dst', 'n'] }],

  // I/O
  ['printf', { returnName: 'len', params: ['fmt'] }],
  ['fprintf', { returnName: 'len', params: ['fp', 'fmt'] }],
  ['vprintf', { returnName: 'len', params: ['fmt', 'args'] }],
  ['vfprintf', { returnName: 'len', params: ['fp', 'fmt', 'args'] }],
  ['puts', { returnName: 'err', params: ['str'] }],
  ['fputs', { returnName: 'err', params: ['str', 'fp'] }],
  ['putchar', { returnName: 'ch', params: ['ch'] }],
  ['fputc', { returnName: 'ch', params: ['ch', 'fp'] }],
  ['getchar', { returnName: 'ch', params: [] }],
  ['fgetc', { returnName: 'ch', params: ['fp'] }],
  ['getc', { returnName: 'ch', params: ['fp'] }],
  ['ungetc', { returnName: 'ch', params: ['ch', 'fp'] }],
  ['fgets', { returnName: 'str', params: ['str', 'n', 'fp'] }],
  ['scanf', { returnName: 'count', params: ['fmt'] }],
  ['fscanf', { returnName: 'count', params: ['fp', 'fmt'] }],
  ['fopen', { returnName: 'fp', params: ['path', 'mode'] }],
  ['fclose', { returnName: 'err', params: ['fp'] }],
  ['fread', { returnName: 'count', params: ['buf', 'size', 'count', 'fp'] }],
  ['fwrite', { returnName: 'count', params: ['buf', 'size', 'count', 'fp'] }],
  ['fseek', { returnName: 'err', params: ['fp', 'offset', 'whence'] }],
  ['ftell', { returnName: 'pos', params: ['fp'] }],
  ['rewind', { returnName: null, params: ['fp'] }],
  ['fflush', { returnName: 'err', params: ['fp'] }],
  ['feof', { returnName: 'val', params: ['fp'] }],
  ['ferror', { returnName: 'err', params: ['fp'] }],
  ['clearerr', { returnName: null, params: ['fp'] }],
  ['remove', { returnName: 'err', params: ['path'] }],
  ['rename', { returnName: 'err', params: ['old_path', 'new_path'] }],

  // Process / program
  ['exit', { returnName: null, params: ['status'] }],
  ['abort', { returnName: null, params: [] }],
  ['atexit', { returnName: 'err', params: ['func'] }],
  ['getenv', { returnName: 'val', params: ['name'] }],
  ['putenv', { returnName: 'err', params: ['str'] }],
  ['setenv', { returnName: 'err', params: ['name', 'val', 'overwrite'] }],
  ['unsetenv', { returnName: 'err', params: ['name'] }],
  ['system', { returnName: 'status', params: ['cmd'] }],
  ['assert', { returnName: null, params: ['cond'] }],

  // Math (integer)
  ['abs', { returnName: 'val', params: ['n'] }],
  ['labs', { returnName: 'val', params: ['n'] }],
  ['llabs', { returnName: 'val', params: ['n'] }],
  ['rand', { returnName: 'val', params: [] }],
  ['srand', { returnName: null, params: ['seed'] }],
  ['qsort', { returnName: null, params: ['base', 'count', 'size', 'compare'] }],
  ['bsearch', { returnName: 'found', params: ['key', 'base', 'count', 'size', 'compare'] }],

  // Math (floating point)
  ['sqrt', { returnName: 'val', params: ['val'] }],
  ['sqrtf', { returnName: 'val', params: ['val'] }],
  ['fabs', { returnName: 'val', params: ['val'] }],
  ['fabsf', { returnName: 'val', params: ['val'] }],
  ['floor', { returnName: 'val', params: ['val'] }],
  ['floorf', { returnName: 'val', params: ['val'] }],
  ['ceil', { returnName: 'val', params: ['val'] }],
  ['ceilf', { returnName: 'val', params: ['val'] }],
  ['round', { returnName: 'val', params: ['val'] }],
  ['roundf', { returnName: 'val', params: ['val'] }],
  ['trunc', { returnName: 'val', params: ['val'] }],
  ['truncf', { returnName: 'val', params: ['val'] }],
  ['sin', { returnName: 'val', params: ['angle'] }],
  ['sinf', { returnName: 'val', params: ['angle'] }],
  ['cos', { returnName: 'val', params: ['angle'] }],
  ['cosf', { returnName: 'val', params: ['angle'] }],
  ['tan', { returnName: 'val', params: ['angle'] }],
  ['tanf', { returnName: 'val', params: ['angle'] }],
  ['asin', { returnName: 'val', params: ['val'] }],
  ['acos', { returnName: 'val', params: ['val'] }],
  ['atan', { returnName: 'val', params: ['val'] }],
  ['atan2', { returnName: 'angle', params: ['y', 'x'] }],
  ['atan2f', { returnName: 'angle', params: ['y', 'x'] }],
  ['pow', { returnName: 'val', params: ['base', 'exp'] }],
  ['powf', { returnName: 'val', params: ['base', 'exp'] }],
  ['log', { returnName: 'val', params: ['val'] }],
  ['logf', { returnName: 'val', params: ['val'] }],
  ['log2', { returnName: 'val', params: ['val'] }],
  ['log10', { returnName: 'val', params: ['val'] }],
  ['exp', { returnName: 'val', params: ['val'] }],
  ['expf', { returnName: 'val', params: ['val'] }],
  ['exp2', { returnName: 'val', params: ['val'] }],
  ['fmod', { returnName: 'val', params: ['x', 'y'] }],
  ['fmodf', { returnName: 'val', params: ['x', 'y'] }],
  ['fmin', { returnName: 'val', params: ['x', 'y'] }],
  ['fmax', { returnName: 'val', params: ['x', 'y'] }],
  ['copysign', { returnName: 'val', params: ['x', 'y'] }],
  ['ldexp', { returnName: 'val', params: ['x', 'exp'] }],
  ['frexp', { returnName: 'val', params: ['x', 'exp'] }],
  ['modf', { returnName: 'val', params: ['x', 'iptr'] }],

  // Time
  ['time', { returnName: 't', params: ['tloc'] }],
  ['clock', { returnName: 'ticks', params: [] }],
  ['difftime', { returnName: 'diff', params: ['t1', 't0'] }],
  ['mktime', { returnName: 't', params: ['tm'] }],
  ['gmtime', { returnName: 'tm', params: ['t'] }],
  ['localtime', { returnName: 'tm', params: ['t'] }],
  ['strftime', { returnName: 'len', params: ['buf', 'max', 'fmt', 'tm'] }],
  ['gettimeofday', { returnName: 'err', params: ['tv', 'tz'] }],
  ['clock_gettime', { returnName: 'err', params: ['clk_id', 'tp'] }],

  // ─── POSIX / Unix ───

  // File & I/O
  ['open', { returnName: 'fd', params: ['path', 'flags', 'mode'] }],
  ['close', { returnName: 'err', params: ['fd'] }],
  ['read', { returnName: 'n', params: ['fd', 'buf', 'count'] }],
  ['write', { returnName: 'n', params: ['fd', 'buf', 'count'] }],
  ['pread', { returnName: 'n', params: ['fd', 'buf', 'count', 'offset'] }],
  ['pwrite', { returnName: 'n', params: ['fd', 'buf', 'count', 'offset'] }],
  ['lseek', { returnName: 'pos', params: ['fd', 'offset', 'whence'] }],
  ['dup', { returnName: 'fd', params: ['fd'] }],
  ['dup2', { returnName: 'fd', params: ['fd', 'fd2'] }],
  ['pipe', { returnName: 'err', params: ['fds'] }],
  ['fcntl', { returnName: 'val', params: ['fd', 'cmd'] }],
  ['ioctl', { returnName: 'val', params: ['fd', 'request'] }],
  ['stat', { returnName: 'err', params: ['path', 'statbuf'] }],
  ['fstat', { returnName: 'err', params: ['fd', 'statbuf'] }],
  ['lstat', { returnName: 'err', params: ['path', 'statbuf'] }],
  ['access', { returnName: 'err', params: ['path', 'mode'] }],
  ['chmod', { returnName: 'err', params: ['path', 'mode'] }],
  ['chown', { returnName: 'err', params: ['path', 'uid', 'gid'] }],
  ['unlink', { returnName: 'err', params: ['path'] }],
  ['rmdir', { returnName: 'err', params: ['path'] }],
  ['mkdir', { returnName: 'err', params: ['path', 'mode'] }],
  ['opendir', { returnName: 'dir', params: ['path'] }],
  ['readdir', { returnName: 'entry', params: ['dir'] }],
  ['closedir', { returnName: 'err', params: ['dir'] }],
  ['getcwd', { returnName: 'path', params: ['buf', 'size'] }],
  ['chdir', { returnName: 'err', params: ['path'] }],
  ['realpath', { returnName: 'path', params: ['path', 'resolved'] }],

  // Process
  ['fork', { returnName: 'pid', params: [] }],
  ['execv', { returnName: 'err', params: ['path', 'argv'] }],
  ['execve', { returnName: 'err', params: ['path', 'argv', 'envp'] }],
  ['waitpid', { returnName: 'pid', params: ['pid', 'status', 'options'] }],
  ['kill', { returnName: 'err', params: ['pid', 'sig'] }],
  ['getpid', { returnName: 'pid', params: [] }],
  ['getppid', { returnName: 'pid', params: [] }],

  // Networking
  ['socket', { returnName: 'fd', params: ['domain', 'type', 'protocol'] }],
  ['bind', { returnName: 'err', params: ['fd', 'addr', 'addrlen'] }],
  ['listen', { returnName: 'err', params: ['fd', 'backlog'] }],
  ['accept', { returnName: 'fd', params: ['fd', 'addr', 'addrlen'] }],
  ['connect', { returnName: 'err', params: ['fd', 'addr', 'addrlen'] }],
  ['send', { returnName: 'n', params: ['fd', 'buf', 'len', 'flags'] }],
  ['recv', { returnName: 'n', params: ['fd', 'buf', 'len', 'flags'] }],
  ['sendto', { returnName: 'n', params: ['fd', 'buf', 'len', 'flags', 'addr', 'addrlen'] }],
  ['recvfrom', { returnName: 'n', params: ['fd', 'buf', 'len', 'flags', 'addr', 'addrlen'] }],
  ['setsockopt', { returnName: 'err', params: ['fd', 'level', 'optname', 'optval', 'optlen'] }],
  ['getsockopt', { returnName: 'err', params: ['fd', 'level', 'optname', 'optval', 'optlen'] }],
  ['htons', { returnName: 'val', params: ['val'] }],
  ['ntohs', { returnName: 'val', params: ['val'] }],
  ['htonl', { returnName: 'val', params: ['val'] }],
  ['ntohl', { returnName: 'val', params: ['val'] }],
  ['inet_addr', { returnName: 'addr', params: ['str'] }],
  ['inet_ntoa', { returnName: 'str', params: ['addr'] }],

  // Threads
  ['pthread_create', { returnName: 'err', params: ['thread', 'attr', 'func', 'arg'] }],
  ['pthread_join', { returnName: 'err', params: ['thread', 'retval'] }],
  ['pthread_exit', { returnName: null, params: ['retval'] }],
  ['pthread_mutex_init', { returnName: 'err', params: ['mutex', 'attr'] }],
  ['pthread_mutex_lock', { returnName: 'err', params: ['mutex'] }],
  ['pthread_mutex_unlock', { returnName: 'err', params: ['mutex'] }],
  ['pthread_mutex_destroy', { returnName: 'err', params: ['mutex'] }],
  ['pthread_cond_wait', { returnName: 'err', params: ['cond', 'mutex'] }],
  ['pthread_cond_signal', { returnName: 'err', params: ['cond'] }],
  ['pthread_cond_broadcast', { returnName: 'err', params: ['cond'] }],
  ['pthread_self', { returnName: 'thread', params: [] }],

  // ─── WASI ───

  // File system
  ['fd_read', { returnName: 'err', params: ['fd', 'iovs', 'iovs_len', 'nread'] }],
  ['fd_write', { returnName: 'err', params: ['fd', 'iovs', 'iovs_len', 'nwritten'] }],
  ['fd_seek', { returnName: 'err', params: ['fd', 'offset', 'whence', 'newoffset'] }],
  ['fd_tell', { returnName: 'err', params: ['fd', 'offset'] }],
  ['fd_close', { returnName: 'err', params: ['fd'] }],
  ['fd_sync', { returnName: 'err', params: ['fd'] }],
  ['fd_datasync', { returnName: 'err', params: ['fd'] }],
  ['fd_filestat_get', { returnName: 'err', params: ['fd', 'stat'] }],
  ['fd_filestat_set_size', { returnName: 'err', params: ['fd', 'size'] }],
  ['fd_filestat_set_times', { returnName: 'err', params: ['fd', 'atim', 'mtim', 'fst_flags'] }],
  ['fd_pread', { returnName: 'err', params: ['fd', 'iovs', 'iovs_len', 'offset', 'nread'] }],
  ['fd_pwrite', { returnName: 'err', params: ['fd', 'iovs', 'iovs_len', 'offset', 'nwritten'] }],
  ['fd_readdir', { returnName: 'err', params: ['fd', 'buf', 'buf_len', 'cookie', 'bufused'] }],
  ['fd_renumber', { returnName: 'err', params: ['fd', 'to'] }],
  ['fd_advise', { returnName: 'err', params: ['fd', 'offset', 'len', 'advice'] }],
  ['fd_allocate', { returnName: 'err', params: ['fd', 'offset', 'len'] }],
  ['fd_prestat_get', { returnName: 'err', params: ['fd', 'buf'] }],
  ['fd_prestat_dir_name', { returnName: 'err', params: ['fd', 'path', 'path_len'] }],
  ['path_open', { returnName: 'err', params: ['fd', 'dirflags', 'path', 'path_len', 'oflags', 'rights_base', 'rights_inheriting', 'fdflags', 'opened_fd'] }],
  ['path_create_directory', { returnName: 'err', params: ['fd', 'path', 'path_len'] }],
  ['path_remove_directory', { returnName: 'err', params: ['fd', 'path', 'path_len'] }],
  ['path_unlink_file', { returnName: 'err', params: ['fd', 'path', 'path_len'] }],
  ['path_rename', { returnName: 'err', params: ['old_fd', 'old_path', 'old_path_len', 'new_fd', 'new_path', 'new_path_len'] }],
  ['path_filestat_get', { returnName: 'err', params: ['fd', 'flags', 'path', 'path_len', 'buf'] }],

  // WASI environment / process / random
  ['environ_get', { returnName: 'err', params: ['environ', 'environ_buf'] }],
  ['environ_sizes_get', { returnName: 'err', params: ['environ_count', 'environ_buf_size'] }],
  ['args_get', { returnName: 'err', params: ['argv', 'argv_buf'] }],
  ['args_sizes_get', { returnName: 'err', params: ['argc', 'argv_buf_size'] }],
  ['clock_time_get', { returnName: 'err', params: ['clock_id', 'precision', 'time'] }],
  ['clock_res_get', { returnName: 'err', params: ['clock_id', 'resolution'] }],
  ['proc_exit', { returnName: null, params: ['rval'] }],
  ['proc_raise', { returnName: 'err', params: ['sig'] }],
  ['random_get', { returnName: 'err', params: ['buf', 'buf_len'] }],
  ['poll_oneoff', { returnName: 'err', params: ['in_subs', 'out_events', 'nsubscriptions', 'nevents'] }],
  ['sched_yield', { returnName: 'err', params: [] }],
  ['sock_accept', { returnName: 'err', params: ['fd', 'flags', 'connection'] }],
  ['sock_recv', { returnName: 'err', params: ['fd', 'ri_data', 'ri_data_len', 'ri_flags', 'ro_datalen', 'ro_flags'] }],
  ['sock_send', { returnName: 'err', params: ['fd', 'si_data', 'si_data_len', 'si_flags', 'so_datalen'] }],
  ['sock_shutdown', { returnName: 'err', params: ['fd', 'how'] }],

  // ─── Emscripten Runtime ───

  ['emscripten_memcpy_js', { returnName: 'dst', params: ['dst', 'src', 'n'] }],
  ['emscripten_memcpy_big', { returnName: 'dst', params: ['dst', 'src', 'n'] }],
  ['emscripten_resize_heap', { returnName: 'ok', params: ['size'] }],
  ['emscripten_get_heap_max', { returnName: 'size', params: [] }],
  ['emscripten_get_sbrk_ptr', { returnName: 'ptr', params: [] }],
  ['emscripten_notify_memory_growth', { returnName: null, params: ['mem_index'] }],
  ['emscripten_stack_init', { returnName: null, params: [] }],
  ['emscripten_stack_get_free', { returnName: 'size', params: [] }],
  ['emscripten_stack_get_base', { returnName: 'ptr', params: [] }],
  ['emscripten_stack_get_end', { returnName: 'ptr', params: [] }],
  ['emscripten_stack_get_current', { returnName: 'ptr', params: [] }],
  ['_emscripten_stack_restore', { returnName: null, params: ['ptr'] }],
  ['_emscripten_stack_alloc', { returnName: 'ptr', params: ['size'] }],
  ['emscripten_run_script', { returnName: null, params: ['script'] }],
  ['emscripten_run_script_int', { returnName: 'val', params: ['script'] }],
  ['emscripten_set_main_loop', { returnName: null, params: ['func', 'fps', 'simulate_infinite_loop'] }],
  ['emscripten_get_now', { returnName: 'ms', params: [] }],
  ['emscripten_sleep', { returnName: null, params: ['ms'] }],

  // C++ exceptions (Emscripten and libc++)
  ['__cxa_allocate_exception', { returnName: 'ex', params: ['size'] }],
  ['__cxa_throw', { returnName: null, params: ['ex', 'type', 'destructor'] }],
  ['__cxa_begin_catch', { returnName: 'ex', params: ['ex'] }],
  ['__cxa_end_catch', { returnName: null, params: [] }],
  ['__cxa_rethrow', { returnName: null, params: [] }],
  ['__cxa_pure_virtual', { returnName: null, params: [] }],
  ['__cxa_guard_acquire', { returnName: 'acquired', params: ['guard'] }],
  ['__cxa_guard_release', { returnName: null, params: ['guard'] }],
  ['__cxa_demangle', { returnName: 'name', params: ['mangled', 'buf', 'len', 'status'] }],

  // setjmp/longjmp
  ['setjmp', { returnName: 'val', params: ['env'] }],
  ['longjmp', { returnName: null, params: ['env', 'val'] }],

  // ─── wasm-bindgen / Rust WASM ───

  ['__wbindgen_malloc', { returnName: 'buf', params: ['size'] }],
  ['__wbindgen_realloc', { returnName: 'buf', params: ['ptr', 'old_size', 'new_size'] }],
  ['__wbindgen_free', { returnName: null, params: ['ptr', 'size'] }],
  ['__wbindgen_exn_store', { returnName: null, params: ['idx'] }],
  ['__wbindgen_add_to_stack_pointer', { returnName: 'ptr', params: ['n'] }],
  ['__wbindgen_string_new', { returnName: 'str', params: ['ptr', 'len'] }],
  ['__wbindgen_object_clone_ref', { returnName: 'obj', params: ['idx'] }],
  ['__wbindgen_object_drop_ref', { returnName: null, params: ['idx'] }],
  ['__wbindgen_cb_drop', { returnName: 'dropped', params: ['idx'] }],
  ['__wbindgen_json_parse', { returnName: 'val', params: ['ptr', 'len'] }],
  ['__wbindgen_jsval_eq', { returnName: 'equal', params: ['a', 'b'] }],
  ['__wbindgen_is_null', { returnName: 'ok', params: ['v'] }],
  ['__wbindgen_is_undefined', { returnName: 'ok', params: ['v'] }],
  ['__wbindgen_is_function', { returnName: 'ok', params: ['v'] }],
  ['__wbindgen_number_new', { returnName: 'num', params: ['n'] }],

  // Rust runtime
  ['__rust_alloc', { returnName: 'buf', params: ['size', 'align'] }],
  ['__rust_dealloc', { returnName: null, params: ['ptr', 'size', 'align'] }],
  ['__rust_realloc', { returnName: 'buf', params: ['ptr', 'old_size', 'align', 'new_size'] }],
  ['__rust_alloc_zeroed', { returnName: 'buf', params: ['size', 'align'] }],

  // ─── Go WASM Runtime ───

  ['runtime.wasmExit', { returnName: null, params: ['code'] }],
  ['runtime.wasmWrite', { returnName: null, params: ['fd', 'p', 'n'] }],
  ['runtime.nanotime1', { returnName: 'ns', params: [] }],
  ['runtime.walltime', { returnName: 'sec', params: [] }],
  ['runtime.scheduleTimeoutEvent', { returnName: 'id', params: ['delay'] }],
  ['runtime.clearTimeoutEvent', { returnName: null, params: ['id'] }],
  ['runtime.getRandomData', { returnName: null, params: ['buf'] }],
  ['syscall/js.valueGet', { returnName: 'ref', params: ['v', 'p', 'len'] }],
  ['syscall/js.valueSet', { returnName: null, params: ['v', 'p', 'len', 'x'] }],
  ['syscall/js.valueCall', { returnName: 'ref', params: ['v', 'm', 'ml', 'args', 'al', 'err'] }],
  ['syscall/js.valueNew', { returnName: 'ref', params: ['v', 'args', 'al', 'err'] }],
  ['syscall/js.valueLength', { returnName: 'len', params: ['v'] }],
  ['syscall/js.copyBytesToGo', { returnName: 'n', params: ['dst', 'dl', 'src'] }],
  ['syscall/js.copyBytesToJS', { returnName: 'n', params: ['dst', 'src', 'sl'] }],

  // ─── AssemblyScript Runtime ───

  ['__new', { returnName: 'ptr', params: ['size', 'id'] }],
  ['__pin', { returnName: 'ptr', params: ['ptr'] }],
  ['__unpin', { returnName: null, params: ['ptr'] }],
  ['__collect', { returnName: null, params: [] }],

  // ─── C++ operators (demangled names) ───

  ['operator new', { returnName: 'obj', params: ['size'] }],
  ['operator new[]', { returnName: 'arr', params: ['size'] }],
  ['operator delete', { returnName: null, params: ['ptr'] }],
  ['operator delete[]', { returnName: null, params: ['ptr'] }],
]);

export function lookupKnownFunction(functionName: string): KnownFunction | null {
  const exact = KNOWN_FUNCTIONS.get(functionName);
  if (exact) {
    return exact;
  }

  // Strip common prefixes: __, _, $, dlsym_, wasm_
  const stripped = functionName.replace(/^(__?|_?\$|dlsym_|wasm_)/, '');
  const strippedResult = KNOWN_FUNCTIONS.get(stripped);
  if (strippedResult) {
    return strippedResult;
  }

  // wasm-bindgen __wbg_ prefix: strip and use remainder as name
  if (functionName.startsWith('__wbg_')) {
    const rest = functionName.slice(6).replace(/_[0-9a-f]+$/, '');
    if (rest.length > 0) {
      return { returnName: rest.slice(0, MAX_GENERATED_NAME_LENGTH), params: [] };
    }
  }

  // Pattern: get_X, fetch_X, read_X, load_X → return X
  const getMatch = functionName.match(/^(?:get|fetch|read|load)_(.+)/);
  if (getMatch) {
    return { returnName: getMatch[1].slice(0, MAX_GENERATED_NAME_LENGTH), params: [] };
  }

  // Pattern: create_X, new_X, alloc_X, make_X → return X
  const createMatch = functionName.match(/^(?:create|new|alloc|make)_(.+)/);
  if (createMatch) {
    return { returnName: createMatch[1].slice(0, MAX_GENERATED_NAME_LENGTH), params: [] };
  }

  // Pattern: X_count, X_size, X_len, X_length → return count
  const sizeMatch = functionName.match(/^(.+)_(?:count|size|len|length)$/);
  if (sizeMatch) {
    return { returnName: 'count', params: [] };
  }

  // Pattern: is_X, has_X, can_X, check_X → return ok
  const boolMatch = functionName.match(/^(?:is|has|can|check)_(.+)/);
  if (boolMatch) {
    return { returnName: 'ok', params: [] };
  }

  // Pattern: parse_X, decode_X → return X
  const parseMatch = functionName.match(/^(?:parse|decode)_(.+)/);
  if (parseMatch) {
    return { returnName: parseMatch[1].slice(0, MAX_GENERATED_NAME_LENGTH), params: [] };
  }

  return null;
}
