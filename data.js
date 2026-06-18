/* ============================================================
   data.js — static content for Placement Tracker
   Exposed as window.AppData
   ============================================================ */
(function () {
  'use strict';

  // Helper to keep question objects compact and readable.
  function q(id, question, options, correctIndex, explanation) {
    return { id: id, question: question, options: options, correctIndex: correctIndex, explanation: explanation };
  }

  /* ============================================================
     JAVA DEV TRACK
     ============================================================ */
  var java = {
    id: 'java',
    name: 'Java Dev Track',
    short: 'Java',
    topics: [
      /* ---------- 1. Core Java Fundamentals ---------- */
      {
        id: 'java-core',
        code: 'JAVA-01',
        name: 'Core Java Fundamentals',
        description: 'Data types, operators, control flow, arrays, strings, and methods.',
        reviewPrompt:
          "You are a strict TCS/Infosys technical interviewer. Quiz me on Core Java Fundamentals: primitive vs reference types, type casting and overflow, operator precedence, the difference between == and .equals(), String immutability and the String pool, arrays (declaration, default values, ArrayIndexOutOfBounds), and method overloading vs passing-by-value. Ask me ONE question at a time. Wait for my answer before telling me if I'm right. Mix concept questions with 'predict the output' code snippets. Start easy, then escalate to tricky edge cases. After 10 questions, give me a score and list my weak spots.",
        questions: [
          q('jc1', 'What is the output?\n\nint x = 10;\nint y = x++ + ++x;\nSystem.out.println(y);', ['20', '21', '22', '23'], 2, 'x++ uses 10 (x becomes 11), then ++x makes x 12 and uses 12, so 10 + 12 = 22.'),
          q('jc2', 'Which of these is NOT a valid Java primitive type?', ['byte', 'short', 'String', 'char'], 2, 'String is a class (reference type), not a primitive; the eight primitives are byte, short, int, long, float, double, char, boolean.'),
          q('jc3', 'What is printed?\n\nSystem.out.println(10 + 20 + "Java" + 10 + 20);', ['30Java1020', '1020Java30', '30Java30', '10Java2030'], 0, 'Left-to-right: 10+20=30, then "30"+"Java"="30Java", and the rest concatenate as strings giving 30Java1020.'),
          q('jc4', 'What is the default value of a local int variable that is declared but not initialized?', ['0', 'null', 'undefined', 'It causes a compile-time error if used'], 3, 'Local variables get no default value; using one before assignment is a compile-time error (unlike instance fields which default to 0).'),
          q('jc5', 'What does this print?\n\nint[] a = new int[3];\nSystem.out.println(a[2]);', ['0', 'null', 'Garbage value', 'ArrayIndexOutOfBoundsException'], 0, 'Array elements of type int are auto-initialized to 0, and index 2 is valid for length 3.'),
          q('jc6', 'Which statement about the byte data type is correct?', ['Its range is -128 to 127', 'It is 16 bits wide', 'It is unsigned in Java', 'Its range is 0 to 255'], 0, 'A byte is a signed 8-bit integer with range -128 to 127; Java has no unsigned primitive types.'),
          q('jc7', 'What is the result of: System.out.println(5 / 2 + 5 % 2);', ['2', '3', '2.5', '3.5'], 1, 'Integer division 5/2 = 2 and 5%2 = 1, so 2 + 1 = 3.'),
          q('jc8', 'What is the output?\n\nString s = "hello";\ns.toUpperCase();\nSystem.out.println(s);', ['HELLO', 'hello', 'Hello', 'Compile error'], 1, 'Strings are immutable; toUpperCase() returns a new string that is discarded, so s is unchanged.'),
          q('jc9', 'How many times does this loop run?\n\nfor (int i = 0; i < 5; i++) {\n  if (i == 3) continue;\n  System.out.print(i);\n}', ['Prints 01234', 'Prints 0124', 'Prints 01245', 'Infinite loop'], 1, 'continue skips printing when i==3, so it prints 0,1,2,4 = "0124".'),
          q('jc10', 'What is the value of c?\n\nchar c = (char) (65 + 1);', ["'A'", "'B'", "'66'", '66'], 1, '65 maps to A in ASCII/Unicode, so 66 cast to char is the letter B.')
        ]
      },

      /* ---------- 2. OOP Concepts ---------- */
      {
        id: 'java-oop',
        code: 'JAVA-02',
        name: 'OOP Concepts',
        description: 'Classes, objects, inheritance, polymorphism, abstraction, encapsulation, interfaces.',
        reviewPrompt:
          "Act as an Infosys InfyTQ interviewer drilling me on Object-Oriented Programming in Java. Cover: the 4 pillars (encapsulation, inheritance, polymorphism, abstraction), method overloading vs overriding, the super and this keywords, abstract classes vs interfaces, constructors and constructor chaining, static vs instance members, and the role of 'final'. Ask ONE question at a time and wait for my reply before revealing the answer. Include at least three 'what is the output' snippets involving inheritance and overriding. End with a score out of 10 and targeted revision advice.",
        questions: [
          q('jo1', 'Which OOP concept is achieved by declaring fields private and exposing public getters/setters?', ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'], 2, 'Hiding internal state behind private fields with controlled accessors is encapsulation.'),
          q('jo2', 'Method overloading is an example of which type of polymorphism?', ['Runtime polymorphism', 'Compile-time polymorphism', 'Dynamic dispatch', 'No polymorphism'], 1, 'Overloading is resolved by the compiler based on argument types, so it is compile-time (static) polymorphism.'),
          q('jo3', 'What is the output?\n\nclass A { void show(){ System.out.print("A"); } }\nclass B extends A { void show(){ System.out.print("B"); } }\nA obj = new B();\nobj.show();', ['A', 'B', 'AB', 'Compile error'], 1, 'Overridden instance methods are dispatched at runtime on the actual object type (B), printing B.'),
          q('jo4', 'Which is true about a Java interface (before Java 8 default methods)?', ['It can have constructors', 'All methods are implicitly public and abstract', 'It can have instance fields', 'It supports multiple inheritance of state'], 1, 'Interface methods are implicitly public and abstract; interfaces cannot have constructors or instance state.'),
          q('jo5', 'What happens if a subclass constructor does not explicitly call super()?', ['Compile error', 'The no-arg superclass constructor is called implicitly', 'No superclass constructor runs', 'The object is not created'], 1, 'The compiler inserts an implicit super() call to the superclass no-argument constructor.'),
          q('jo6', 'Which keyword prevents a class from being subclassed?', ['static', 'private', 'final', 'abstract'], 2, 'A final class cannot be extended; abstract is the opposite (must be extended).'),
          q('jo7', 'What is the output?\n\nclass A { A(){ System.out.print("1"); } }\nclass B extends A { B(){ System.out.print("2"); } }\nnew B();', ['2', '12', '21', '1'], 1, 'Construction runs superclass constructor first (1), then the subclass body (2), giving 12.'),
          q('jo8', 'An abstract class in Java...', ['Cannot have any concrete methods', 'Cannot have a constructor', 'Can be instantiated directly', 'Can have both abstract and concrete methods'], 3, 'Abstract classes may mix abstract and concrete methods and may have constructors, but cannot be instantiated directly.'),
          q('jo9', 'Which is NOT achievable in Java?', ['Multiple inheritance via interfaces', 'Single inheritance of classes', 'Multiple inheritance of classes', 'Implementing many interfaces'], 2, 'Java does not allow a class to extend multiple classes; multiple inheritance of type is only via interfaces.'),
          q('jo10', 'If a method is declared static, it cannot...', ['Be called without an object', 'Access non-static instance variables directly', 'Be overloaded', 'Belong to a class'], 1, 'Static methods have no implicit this, so they cannot directly access instance (non-static) members.')
        ]
      },

      /* ---------- 3. Exception Handling ---------- */
      {
        id: 'java-exceptions',
        code: 'JAVA-03',
        name: 'Exception Handling',
        description: 'try/catch/finally, checked vs unchecked, custom exceptions, throws/throw.',
        reviewPrompt:
          "You are a Wipro NLTH interviewer testing my Java Exception Handling. Cover the exception hierarchy (Throwable, Error, Exception, RuntimeException), checked vs unchecked exceptions, try-catch-finally execution order, try-with-resources, multi-catch, the difference between throw and throws, exception propagation up the call stack, and how to create custom exceptions. Ask ONE question at a time, wait for my answer, then explain. Include 'predict the output' snippets where finally interacts with return statements. Finish with a 10-point score and what to revise.",
        questions: [
          q('je1', 'Which of these is a checked exception?', ['NullPointerException', 'ArrayIndexOutOfBoundsException', 'IOException', 'ArithmeticException'], 2, 'IOException extends Exception (but not RuntimeException), so it is checked; the others are unchecked RuntimeExceptions.'),
          q('je2', 'What is the output?\n\ntry { System.out.print("A"); return; }\nfinally { System.out.print("B"); }', ['A', 'B', 'AB', 'BA'], 2, 'finally always executes even after a return in try, so A prints then B, giving AB.'),
          q('je3', 'What is the parent class of all exceptions and errors in Java?', ['Exception', 'Throwable', 'RuntimeException', 'Object'], 1, 'Throwable is the root of the exception hierarchy; both Error and Exception extend it.'),
          q('je4', 'The difference between throw and throws is:', ['throw declares, throws actually raises', 'throw raises an exception, throws declares possible exceptions in a method signature', 'They are identical', 'throws can only be used inside catch'], 1, 'throw raises an exception object; throws is a method-signature clause declaring which checked exceptions may propagate.'),
          q('je5', 'What is the output?\n\ntry { int x = 5/0; }\ncatch (ArithmeticException e) { System.out.print("C"); }\ncatch (Exception e) { System.out.print("E"); }', ['C', 'E', 'CE', 'Compile error'], 0, '5/0 throws ArithmeticException, caught by the first (more specific) catch, printing C.'),
          q('je6', 'A class extending Exception (not RuntimeException) creates a:', ['Unchecked exception', 'Checked exception', 'Error', 'Warning'], 1, 'Subclasses of Exception that are not under RuntimeException are checked exceptions and must be declared or handled.'),
          q('je7', 'Which catch ordering causes a compile error?', ['catch(IOException) before catch(Exception)', 'catch(Exception) before catch(IOException)', 'catch(ArithmeticException) before catch(RuntimeException)', 'Two unrelated exception catches'], 1, 'A broader type before a subclass makes the later catch unreachable, which is a compile-time error.'),
          q('je8', 'What does try-with-resources guarantee?', ['The resource is never closed', 'close() is called automatically at the end of the block', 'No exceptions can occur', 'The catch block is skipped'], 1, 'try-with-resources auto-invokes close() on AutoCloseable resources when the block exits.'),
          q('je9', 'What is the output?\n\ntry { System.out.print("A"); throw new RuntimeException(); }\ncatch (Exception e) { System.out.print("B"); }\nfinally { System.out.print("C"); }', ['AB', 'ABC', 'AC', 'ABCException'], 1, 'A prints, the exception is caught printing B, then finally prints C: ABC.'),
          q('je10', 'If an exception is thrown and not caught anywhere, what happens?', ['It is silently ignored', 'It propagates up the call stack; if uncaught the thread terminates', 'The program restarts', 'It becomes a checked exception'], 1, 'Uncaught exceptions propagate up the stack and, if never handled, terminate the thread with a stack trace.')
        ]
      },

      /* ---------- 4. Java Collections Framework ---------- */
      {
        id: 'java-collections',
        code: 'JAVA-04',
        name: 'Java Collections Framework',
        description: 'List, Set, Map, Queue, Iterator, Collections utility class, comparators.',
        reviewPrompt:
          "Be a senior Java interviewer at TCS quizzing me on the Collections Framework. Cover: the Collection vs Map hierarchy, ArrayList vs LinkedList, HashSet vs TreeSet vs LinkedHashSet, HashMap vs TreeMap vs LinkedHashMap, how HashMap works internally (buckets, hashCode, equals, collisions), fail-fast iterators and ConcurrentModificationException, Comparable vs Comparator, and the Collections utility class. Ask ONE question at a time and wait for my response. Include output-prediction snippets. End with a score out of 10 and weak areas.",
        questions: [
          q('jcl1', 'Which collection does NOT allow duplicate elements?', ['ArrayList', 'LinkedList', 'HashSet', 'Vector'], 2, 'Set implementations like HashSet reject duplicates; List implementations allow them.'),
          q('jcl2', 'What is the output?\n\nSet<Integer> s = new HashSet<>();\ns.add(1); s.add(2); s.add(1);\nSystem.out.println(s.size());', ['1', '2', '3', '0'], 1, 'HashSet ignores the duplicate 1, leaving two distinct elements, so size is 2.'),
          q('jcl3', 'Which Map implementation maintains keys in sorted order?', ['HashMap', 'LinkedHashMap', 'TreeMap', 'Hashtable'], 2, 'TreeMap stores keys in sorted (natural or comparator) order using a red-black tree.'),
          q('jcl4', 'For frequent insertions/deletions in the middle, which is generally better?', ['ArrayList', 'LinkedList', 'Vector', 'They are identical'], 1, 'LinkedList offers O(1) structural inserts/removes given a node, while ArrayList must shift elements.'),
          q('jcl5', 'What two methods must be correctly overridden for objects to work as HashMap keys?', ['compareTo() and equals()', 'hashCode() and equals()', 'toString() and hashCode()', 'clone() and equals()'], 1, 'HashMap locates entries by hashCode() bucket then equals() comparison, so both must be consistent.'),
          q('jcl6', 'What is thrown if you modify a list directly during a for-each iteration?', ['NullPointerException', 'ConcurrentModificationException', 'IndexOutOfBoundsException', 'Nothing'], 1, 'Fail-fast iterators detect structural modification during iteration and throw ConcurrentModificationException.'),
          q('jcl7', 'The Comparator interface is used to:', ['Make a class itself comparable', 'Define an external/custom ordering', 'Remove duplicates', 'Synchronize a collection'], 1, 'Comparator defines ordering logic externally, separate from the class\'s natural Comparable ordering.'),
          q('jcl8', 'What is the output?\n\nList<Integer> l = new ArrayList<>(List.of(3,1,2));\nCollections.sort(l);\nSystem.out.println(l);', ['[3, 1, 2]', '[1, 2, 3]', '[3, 2, 1]', '[1, 3, 2]'], 1, 'Collections.sort orders elements by natural ordering, giving [1, 2, 3].'),
          q('jcl9', 'Which interface does NOT extend Collection?', ['List', 'Set', 'Queue', 'Map'], 3, 'Map is a separate top-level interface (key-value pairs), not a subtype of Collection.'),
          q('jcl10', 'A HashMap allows how many null keys?', ['Zero', 'Exactly one', 'Unlimited', 'Two'], 1, 'HashMap permits a single null key (stored in bucket 0) and multiple null values.')
        ]
      },

      /* ---------- 5. Generics ---------- */
      {
        id: 'java-generics',
        code: 'JAVA-05',
        name: 'Generics',
        description: 'Type parameters, bounded types, wildcards, generic methods.',
        reviewPrompt:
          "Act as a Java interviewer testing my understanding of Generics. Cover: type parameters and naming conventions (T, E, K, V), generic classes and generic methods, bounded type parameters (extends), wildcards (? extends, ? super, unbounded ?), the PECS principle (Producer Extends Consumer Super), type erasure and its consequences, and why you cannot create an array of a generic type. Ask ONE question at a time, wait for my answer, then explain clearly. Include code snippets that may or may not compile. End with a score and revision plan.",
        questions: [
          q('jg1', 'What is the main benefit of generics?', ['Faster runtime', 'Compile-time type safety and no explicit casts', 'Smaller class files', 'Automatic multithreading'], 1, 'Generics catch type errors at compile time and remove the need for manual casting.'),
          q('jg2', 'What does <? extends Number> mean?', ['Any type that is a superclass of Number', 'Number or any of its subclasses', 'Only Number itself', 'Any type at all'], 1, 'An upper-bounded wildcard accepts Number and its subclasses (Integer, Double, etc.).'),
          q('jg3', 'According to PECS, a method that only reads from a generic structure should use:', ['? super T', '? extends T', 'Exactly T', 'No wildcard'], 1, 'Producers (sources you read from) use "extends"; consumers (you write to) use "super".'),
          q('jg4', 'What is type erasure?', ['Removing unused types', 'Generic type info is removed at compile time and not present at runtime', 'Deleting type parameters from source', 'Converting types to Object permanently in source'], 1, 'The compiler enforces generics then erases the type parameters, so they are not available at runtime.'),
          q('jg5', 'Which declaration is a valid generic method?', ['public T <T> get()', 'public <T> T get()', 'public T get<T>()', 'public get <T> T()'], 1, 'The type parameter section <T> comes before the return type in a generic method declaration.'),
          q('jg6', 'Why can you NOT write: new T[10] inside a generic class?', ['T is final', 'Arrays need reifiable types but T is erased', 'Arrays cannot hold objects', 'It is allowed'], 1, 'Generic type info is erased, so the runtime cannot create a properly typed array of T.'),
          q('jg7', 'A bounded type parameter <T extends Comparable<T>> ensures that:', ['T must be an interface', 'T objects can be compared with compareTo', 'T cannot be subclassed', 'T is always a Number'], 1, 'The bound guarantees every T implements Comparable, so compareTo() is available.'),
          q('jg8', 'List<?> (unbounded wildcard) allows you to:', ['Add any element', 'Add only null and read elements as Object', 'Add only Strings', 'Nothing at all'], 1, 'With an unbounded wildcard you cannot add elements (except null) but can read them as Object.'),
          q('jg9', 'What is the output type concern here?\n\nList<String> l = new ArrayList<>();\nList<Object> o = l; // ?', ['Compiles fine', 'Compile error — generics are invariant', 'Runtime error', 'Warning only'], 1, 'Generics are invariant: List<String> is not a subtype of List<Object>, so this is a compile error.'),
          q('jg10', 'The naming convention "E" in generics conventionally stands for:', ['Exception', 'Element', 'Enum', 'Entity'], 1, 'By convention E denotes an Element (used in collections), K/V for key/value, T for type.')
        ]
      },

      /* ---------- 6. Java Streams & Lambdas ---------- */
      {
        id: 'java-streams',
        code: 'JAVA-06',
        name: 'Java Streams & Lambdas',
        description: 'Stream API, filter/map/reduce, method references, Optional.',
        reviewPrompt:
          "You are a modern Java interviewer testing Streams and Lambdas (Java 8+). Cover: functional interfaces (Predicate, Function, Consumer, Supplier), lambda syntax, method references (4 kinds), the Stream pipeline (source, intermediate, terminal operations), laziness, filter/map/reduce/collect, Collectors (toList, groupingBy, joining), and Optional (of, ofNullable, orElse, map). Ask ONE question at a time and wait for my answer. Include output-prediction snippets. Finish with a score out of 10 and weak spots.",
        questions: [
          q('js1', 'Which is a terminal operation on a Stream?', ['filter()', 'map()', 'collect()', 'peek()'], 2, 'collect() is terminal and triggers pipeline execution; filter, map, and peek are intermediate.'),
          q('js2', 'What is the output?\n\nList.of(1,2,3,4).stream().filter(n -> n%2==0).count();', ['1', '2', '3', '4'], 1, 'filter keeps even numbers 2 and 4, so count() returns 2.'),
          q('js3', 'Which functional interface returns a boolean and takes one argument?', ['Function<T,R>', 'Consumer<T>', 'Predicate<T>', 'Supplier<T>'], 2, 'Predicate<T> has test(T) returning boolean; Function transforms, Consumer accepts, Supplier produces.'),
          q('js4', 'Streams are lazy. This means intermediate operations:', ['Execute immediately', 'Only execute when a terminal operation is invoked', 'Never execute', 'Run on a separate thread'], 1, 'Intermediate operations build the pipeline but only run when a terminal operation pulls data through.'),
          q('js5', 'What does Optional.orElse("x") return for an empty Optional?', ['null', 'An exception', '"x"', 'Optional.empty()'], 2, 'orElse supplies the default value "x" when the Optional has no value.'),
          q('js6', 'String::toUpperCase is an example of:', ['A lambda', 'A method reference', 'A constructor reference', 'An anonymous class'], 1, 'It is a reference to an instance method of an arbitrary object, a form of method reference.'),
          q('js7', 'What is the output?\n\nint sum = Stream.of(1,2,3).reduce(0, Integer::sum);\nSystem.out.println(sum);', ['0', '3', '6', '123'], 2, 'reduce starts at 0 and accumulates 1+2+3 = 6.'),
          q('js8', 'Which collector groups elements by a classifier function?', ['Collectors.toList()', 'Collectors.joining()', 'Collectors.groupingBy()', 'Collectors.counting()'], 2, 'Collectors.groupingBy() partitions stream elements into a Map keyed by the classifier result.'),
          q('js9', 'Can a stream be reused after a terminal operation?', ['Yes, unlimited times', 'No, it throws IllegalStateException if reused', 'Only twice', 'Only for parallel streams'], 1, 'A stream is single-use; operating on it again after a terminal op throws IllegalStateException.'),
          q('js10', 'What does map() do in a stream pipeline?', ['Filters elements', 'Transforms each element to another value', 'Sorts elements', 'Counts elements'], 1, 'map applies a function to each element, producing a new stream of transformed values.')
        ]
      },

      /* ---------- 7. Multithreading Basics ---------- */
      {
        id: 'java-threads',
        code: 'JAVA-07',
        name: 'Multithreading Basics',
        description: 'Thread class, Runnable, synchronized, wait/notify, ExecutorService.',
        reviewPrompt:
          "Act as a TCS interviewer testing Java Multithreading basics. Cover: creating threads (extending Thread vs implementing Runnable), thread lifecycle states (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED), start() vs run(), synchronized methods and blocks, race conditions and the role of locks, wait()/notify()/notifyAll(), the volatile keyword, and the ExecutorService thread pool. Ask ONE question at a time, wait for my answer, then explain. Include conceptual traps. End with a 10-point score and revision tips.",
        questions: [
          q('jt1', 'What is the difference between calling start() and run() on a Thread?', ['No difference', 'start() begins a new thread; run() executes in the current thread', 'run() is faster', 'start() blocks the caller'], 1, 'start() creates a new call stack/thread that invokes run(); calling run() directly just executes it on the current thread.'),
          q('jt2', 'Which is generally the preferred way to define a task for a thread?', ['Extending Thread', 'Implementing Runnable', 'Both are identical', 'Using a static method'], 1, 'Implementing Runnable keeps your single-inheritance slot free and separates task from thread, so it is preferred.'),
          q('jt3', 'The synchronized keyword prevents:', ['Deadlocks entirely', 'Multiple threads executing a critical section concurrently', 'Thread creation', 'Garbage collection'], 1, 'synchronized enforces mutual exclusion so only one thread holds the monitor for the critical section at a time.'),
          q('jt4', 'wait() must be called:', ['From any context', 'From within a synchronized block on the same object', 'Only in main', 'After notify()'], 1, 'wait()/notify() require holding the object\'s monitor, so they must run inside synchronized code on that object.'),
          q('jt5', 'The volatile keyword guarantees:', ['Atomic compound operations', 'Visibility of writes across threads', 'Mutual exclusion', 'Thread priority'], 1, 'volatile ensures changes are visible to all threads but does not make compound actions like i++ atomic.'),
          q('jt6', 'What does ExecutorService provide over manually creating threads?', ['Nothing', 'Thread pooling and lifecycle management', 'Guaranteed no bugs', 'Faster CPU'], 1, 'ExecutorService manages a reusable pool of threads and handles submission, scheduling, and shutdown.'),
          q('jt7', 'A thread that is waiting to acquire a lock held by another thread is in which state?', ['RUNNABLE', 'BLOCKED', 'WAITING', 'NEW'], 1, 'A thread waiting to enter a synchronized section (acquire a monitor lock) is in the BLOCKED state.'),
          q('jt8', 'What is a race condition?', ['Two threads finishing at the same time', 'Result depends on unpredictable thread scheduling of shared data access', 'A deadlock', 'A thread running too fast'], 1, 'A race condition occurs when unsynchronized concurrent access to shared mutable state makes the outcome timing-dependent.'),
          q('jt9', 'notifyAll() differs from notify() in that it:', ['Wakes only one waiting thread', 'Wakes all threads waiting on the monitor', 'Terminates threads', 'Does nothing'], 1, 'notifyAll() wakes every thread waiting on the object\'s monitor; notify() wakes only one arbitrary thread.'),
          q('jt10', 'How many times can start() be called on the same Thread object?', ['Unlimited', 'Exactly once; a second call throws IllegalThreadStateException', 'Twice', 'Zero'], 1, 'A Thread can be started only once; calling start() again throws IllegalThreadStateException.')
        ]
      },

      /* ---------- 8. SQL & JDBC ---------- */
      {
        id: 'java-jdbc',
        code: 'JAVA-08',
        name: 'SQL & JDBC',
        description: 'SELECT/JOIN/GROUP BY/subqueries, PreparedStatement, ResultSet, connection pooling.',
        reviewPrompt:
          "You are a backend interviewer testing my SQL and JDBC. Cover SQL: SELECT with WHERE/ORDER BY, the JOIN types (INNER, LEFT, RIGHT, FULL), GROUP BY with HAVING vs WHERE, aggregate functions, subqueries and correlated subqueries. Then JDBC: the connection steps, Statement vs PreparedStatement (and SQL injection), ResultSet navigation, executeQuery vs executeUpdate, and what a connection pool is for. Ask ONE question at a time, wait for my answer, then explain. End with a score out of 10 and weak spots.",
        questions: [
          q('jd1', 'Which JOIN returns all rows from the left table and matching rows from the right (null where no match)?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'], 1, 'LEFT JOIN keeps all left-table rows and fills unmatched right-table columns with NULL.'),
          q('jd2', 'The difference between WHERE and HAVING is:', ['They are identical', 'WHERE filters rows before grouping; HAVING filters groups after aggregation', 'HAVING is faster', 'WHERE works only on numbers'], 1, 'WHERE filters individual rows pre-aggregation; HAVING filters aggregated groups produced by GROUP BY.'),
          q('jd3', 'Why prefer PreparedStatement over Statement?', ['It is shorter to type', 'It prevents SQL injection and supports precompiled parameterized queries', 'It returns more rows', 'It is required for SELECT'], 1, 'PreparedStatement parameterizes input (blocking SQL injection) and can be precompiled and reused efficiently.'),
          q('jd4', 'Which JDBC method is used to run a SELECT query?', ['executeUpdate()', 'executeQuery()', 'execute()', 'runQuery()'], 1, 'executeQuery() returns a ResultSet for SELECT; executeUpdate() is for INSERT/UPDATE/DELETE.'),
          q('jd5', 'What does executeUpdate() return?', ['A ResultSet', 'The number of affected rows', 'A boolean', 'Nothing'], 1, 'executeUpdate() returns an int count of rows affected by the DML statement.'),
          q('jd6', 'Which query finds the second highest salary?', ['SELECT MAX(salary) FROM emp', 'SELECT MAX(salary) FROM emp WHERE salary < (SELECT MAX(salary) FROM emp)', 'SELECT salary FROM emp LIMIT 2', 'SELECT TOP 2 salary FROM emp'], 1, 'The subquery finds the max below the overall max, yielding the second highest salary.'),
          q('jd7', 'GROUP BY is used to:', ['Sort rows', 'Aggregate rows that share values into summary rows', 'Join tables', 'Delete duplicates only'], 1, 'GROUP BY collapses rows with equal grouping-column values so aggregates (COUNT, SUM, etc.) apply per group.'),
          q('jd8', 'A ResultSet cursor initially points:', ['At the first row', 'Before the first row (call next() to advance)', 'After the last row', 'At a random row'], 1, 'A ResultSet starts positioned before the first row; the first next() call moves to row one.'),
          q('jd9', 'What is the main purpose of a connection pool?', ['Encrypt data', 'Reuse a set of open DB connections to avoid costly repeated connect/disconnect', 'Cache query results', 'Compress data'], 1, 'A connection pool maintains reusable connections so apps avoid the overhead of opening one per request.'),
          q('jd10', 'Which clause removes duplicate rows from a SELECT result?', ['UNIQUE', 'DISTINCT', 'GROUP', 'FILTER'], 1, 'SELECT DISTINCT eliminates duplicate rows from the result set.')
        ]
      },

      /* ---------- 9. Spring Boot Basics ---------- */
      {
        id: 'java-spring',
        code: 'JAVA-09',
        name: 'Spring Boot Basics',
        description: '@SpringBootApplication, auto-configuration, application.properties, stereotype annotations.',
        reviewPrompt:
          "Act as a Spring Boot interviewer for a Java backend role. Cover: what Spring Boot adds over plain Spring, @SpringBootApplication (and the 3 annotations it combines), auto-configuration and starters, the embedded server, dependency injection and IoC, the stereotype annotations (@Component, @Service, @Repository, @Controller), @Autowired and constructor injection, and application.properties/yml configuration. Ask ONE question at a time, wait for my reply, then explain. End with a score out of 10 and what to revise.",
        questions: [
          q('jsp1', '@SpringBootApplication is a combination of which three annotations?', ['@Configuration, @EnableAutoConfiguration, @ComponentScan', '@Service, @Repository, @Controller', '@Bean, @Autowired, @Component', '@RestController, @RequestMapping, @Configuration'], 0, '@SpringBootApplication bundles @Configuration, @EnableAutoConfiguration, and @ComponentScan.'),
          q('jsp2', 'What does Spring Boot auto-configuration do?', ['Writes your business logic', 'Automatically configures beans based on classpath dependencies', 'Deploys to the cloud', 'Generates the database'], 1, 'Auto-configuration inspects the classpath and existing beans to configure sensible defaults automatically.'),
          q('jsp3', 'Which annotation marks a class as a service-layer component?', ['@Repository', '@Service', '@Controller', '@Entity'], 1, '@Service is the stereotype for service/business-logic layer beans.'),
          q('jsp4', 'What is Inversion of Control (IoC) in Spring?', ['The app controls object creation', 'The container creates and injects dependencies instead of the object doing it', 'Reversing method calls', 'A design pattern for loops'], 1, 'With IoC the Spring container instantiates and wires dependencies, rather than objects creating their own.'),
          q('jsp5', 'Which is the recommended dependency injection style?', ['Field injection', 'Constructor injection', 'Static injection', 'Setter injection only'], 1, 'Constructor injection is preferred for required dependencies, immutability, and easier testing.'),
          q('jsp6', '@Repository is typically used on:', ['REST endpoints', 'Data access/persistence classes', 'Configuration classes', 'The main class'], 1, '@Repository marks DAO/persistence beans and enables exception translation.'),
          q('jsp7', 'Where do you typically configure the server port in Spring Boot?', ['pom.xml', 'application.properties (server.port)', 'Main method arguments only', 'web.xml'], 1, 'server.port in application.properties (or application.yml) sets the embedded server port.'),
          q('jsp8', 'A Spring Boot "starter" is:', ['A main method', 'A curated set of dependencies for a feature (e.g. spring-boot-starter-web)', 'A database', 'A thread pool'], 1, 'Starters are convenient dependency descriptors that pull in everything needed for a feature.'),
          q('jsp9', 'What does @Autowired do?', ['Creates a database', 'Tells Spring to inject a matching bean dependency', 'Starts a thread', 'Maps a URL'], 1, '@Autowired requests dependency injection of a compatible bean from the container.'),
          q('jsp10', 'Spring Boot apps commonly run with an embedded server such as:', ['Apache HTTP Server', 'Tomcat', 'Nginx', 'IIS'], 1, 'Spring Boot embeds Tomcat (by default), Jetty, or Undertow so no external server install is needed.')
        ]
      },

      /* ---------- 10. REST API Design ---------- */
      {
        id: 'java-rest',
        code: 'JAVA-10',
        name: 'REST API Design',
        description: '@RestController, request mappings, @RequestBody/@PathVariable, HTTP status codes, Postman.',
        reviewPrompt:
          "You are interviewing me for a Java/Spring REST developer role. Cover: REST principles (statelessness, resources, HTTP verbs), @RestController vs @Controller, @GetMapping/@PostMapping/@PutMapping/@DeleteMapping, @RequestBody vs @PathVariable vs @RequestParam, ResponseEntity and HTTP status codes (200, 201, 204, 400, 401, 403, 404, 500), idempotency of HTTP methods, and using Postman to test endpoints. Ask ONE question at a time, wait for my answer, then explain. End with a score out of 10 and revision focus.",
        questions: [
          q('jr1', 'Which HTTP method is typically used to create a new resource?', ['GET', 'POST', 'DELETE', 'HEAD'], 1, 'POST is conventionally used to create a new resource on the server.'),
          q('jr2', 'What HTTP status code indicates a resource was successfully created?', ['200 OK', '201 Created', '204 No Content', '404 Not Found'], 1, '201 Created signals that a new resource was successfully created.'),
          q('jr3', 'Which annotation binds a value from the URL path like /users/{id}?', ['@RequestBody', '@RequestParam', '@PathVariable', '@RequestHeader'], 2, '@PathVariable extracts values from URI template path segments such as {id}.'),
          q('jr4', '@RestController is equivalent to:', ['@Controller + @ResponseBody', '@Service + @Component', '@Controller + @RequestMapping', '@Repository + @ResponseBody'], 0, '@RestController combines @Controller with @ResponseBody so return values are serialized to the response body.'),
          q('jr5', 'Which HTTP status code means the client sent a malformed/invalid request?', ['200', '301', '400', '500'], 2, '400 Bad Request indicates the server could not process the request due to client error.'),
          q('jr6', '@RequestBody is used to:', ['Read a path segment', 'Bind the HTTP request body (e.g. JSON) to a Java object', 'Set a header', 'Read query parameters'], 1, '@RequestBody deserializes the request body (commonly JSON) into a method parameter object.'),
          q('jr7', 'Which HTTP methods are considered idempotent?', ['POST', 'GET, PUT, DELETE', 'Only POST', 'PATCH only'], 1, 'GET, PUT, and DELETE are idempotent (repeating them yields the same server state); POST is not.'),
          q('jr8', 'What status code is returned when a requested resource does not exist?', ['400', '403', '404', '500'], 2, '404 Not Found indicates the requested resource could not be located.'),
          q('jr9', 'A key REST constraint is that the server should be:', ['Stateful per client', 'Stateless (each request carries all needed context)', 'Single-threaded', 'Bound to one client'], 1, 'REST mandates statelessness: each request must contain all information needed, with no server-side session reliance.'),
          q('jr10', 'Which annotation reads a query parameter such as ?page=2?', ['@PathVariable', '@RequestParam', '@RequestBody', '@ModelAttribute'], 1, '@RequestParam binds query-string parameters like page=2 to method arguments.')
        ]
      }
    ]
  };

  /* ============================================================
     PLACEMENT APTITUDE TRACK
     ============================================================ */
  var aptitude = {
    id: 'aptitude',
    name: 'Placement Aptitude Track',
    short: 'Aptitude',
    topics: [
      /* ---------- 1. Percentages & Averages ---------- */
      {
        id: 'apt-percentages',
        code: 'APT-01',
        name: 'Percentages & Averages',
        description: 'Percentage change, average, weighted average.',
        reviewPrompt:
          "Act as a TCS NQT aptitude trainer drilling me on Percentages and Averages. Cover: converting between fractions/decimals/percentages, percentage increase and decrease, successive percentage change, the net change formula, simple average, average speed, and weighted average. Ask ONE question at a time in the style of TCS/Wipro/Infosys tests, wait for my answer, then show the quick shortcut method. Start moderate and increase difficulty. After 10 questions give me a score out of 10 and tell me which sub-types to practice more.",
        questions: [
          q('ap1', 'If a number is increased by 20% and then decreased by 20%, the net change is:', ['No change', '4% increase', '4% decrease', '2% decrease'], 2, 'Net change = +20 - 20 - (20*20)/100 = -4%, a 4% decrease.'),
          q('ap2', 'The average of 5 consecutive numbers is 30. The largest number is:', ['30', '32', '34', '28'], 1, 'For consecutive numbers the average is the middle term (30), so the numbers are 28..32; largest is 32.'),
          q('ap3', 'What is 15% of 40% of 200?', ['6', '12', '18', '30'], 1, '40% of 200 = 80, and 15% of 80 = 12.'),
          q('ap4', 'A student scored 80 out of 120. What percentage is that (approx)?', ['60.0%', '66.67%', '70.0%', '75.0%'], 1, '80/120 = 2/3 = 66.67%.'),
          q('ap5', 'The average age of 10 students is 15. If the teacher is included, the average becomes 16. The teacher\'s age is:', ['25', '26', '27', '30'], 1, 'New total = 11*16 = 176; old total = 150; teacher = 176 - 150 = 26.'),
          q('ap6', 'If the price of sugar rises 25%, by what percent must consumption be reduced to keep expenditure unchanged?', ['25%', '20%', '15%', '30%'], 1, 'Reduction% = 25/(100+25) *100 = 25/125*100 = 20%.'),
          q('ap7', 'The average of first 10 natural numbers is:', ['5', '5.5', '6', '4.5'], 1, 'Sum = 55, average = 55/10 = 5.5.'),
          q('ap8', 'A man spends 75% of his income. If his income increases 20% and expenditure increases 10%, his savings increase by:', ['10%', '50%', '20%', '25%'], 1, 'Old save 25. New income 120, new expense 0.75*110=82.5, new save 37.5; increase = (37.5-25)/25 = 50%.'),
          q('ap9', 'Two numbers are 25% and 40% more than a third number. The first as a percentage of the second is:', ['85.5%', '89.3%', '62.5%', '160%'], 1, '125/140 *100 = 89.28% ≈ 89.3%.'),
          q('ap10', 'The average of 4 numbers is 20. If one number 25 is removed, the average of the rest is:', ['15', '18.33', '20', '21.67'], 1, 'Total = 80; remove 25 → 55 over 3 numbers = 18.33.')
        ]
      },

      /* ---------- 2. Profit, Loss & Discount ---------- */
      {
        id: 'apt-profit',
        code: 'APT-02',
        name: 'Profit, Loss & Discount',
        description: 'SP/CP, profit%, loss%, discount, marked price.',
        reviewPrompt:
          "You are an Infosys aptitude coach testing Profit, Loss and Discount. Cover: cost price, selling price, marked price, profit% and loss% (always on CP unless stated), discount% (on MP), successive discounts, the relation between MP, discount, and SP, and dishonest-dealer/false-weight problems. Ask ONE TCS/Infosys-style question at a time, wait for my answer, then show the fastest method. Increase difficulty gradually. End with a score out of 10 and the sub-topics I should drill.",
        questions: [
          q('pl1', 'An article bought for 400 is sold for 500. The profit percent is:', ['20%', '25%', '15%', '10%'], 1, 'Profit = 100 on CP 400 → 100/400 = 25%.'),
          q('pl2', 'By selling at 90, a man loses 10%. The cost price is:', ['99', '100', '81', '110'], 1, 'CP = 90 / 0.90 = 100.'),
          q('pl3', 'A shopkeeper marks goods 40% above cost and gives a 10% discount. His profit percent is:', ['30%', '26%', '24%', '14%'], 1, 'MP = 140, SP = 0.9*140 = 126, profit = 26 on CP 100 = 26%.'),
          q('pl4', 'Successive discounts of 20% and 10% are equivalent to a single discount of:', ['30%', '28%', '32%', '25%'], 1, 'Net = 100 - 80*0.9 = 100 - 72 = 28%.'),
          q('pl5', 'If CP of 15 articles equals SP of 12 articles, the profit percent is:', ['20%', '25%', '12%', '15%'], 1, 'Profit% = (15-12)/12 *100 = 25%.'),
          q('pl6', 'A man sells two items at 12 each, gaining 20% on one and losing 20% on the other. Net result:', ['No profit no loss', 'Loss of 1', 'Profit of 1', 'Loss of 2'], 1, 'CP1=10, CP2=15, total CP=25, SP=24 → loss of 1.'),
          q('pl7', 'The marked price is 600 and a discount of 15% is given. The selling price is:', ['510', '500', '520', '540'], 0, 'SP = 600 * 0.85 = 510.'),
          q('pl8', 'A trader uses a 900g weight for a kg while selling at cost price. His profit percent is approximately:', ['10%', '11.11%', '9%', '12.5%'], 1, 'Profit% = 100/900 *100 = 11.11%.'),
          q('pl9', 'An item costing 250 is to be sold at 20% profit. The selling price is:', ['275', '300', '290', '320'], 1, 'SP = 250 * 1.20 = 300.'),
          q('pl10', 'A discount of 25% on the marked price gives an SP of 450. The marked price is:', ['600', '562.5', '575', '500'], 0, 'MP = 450 / 0.75 = 600.')
        ]
      },

      /* ---------- 3. Time, Speed & Distance ---------- */
      {
        id: 'apt-tsd',
        code: 'APT-03',
        name: 'Time, Speed & Distance',
        description: 'Relative speed, trains, boats & streams.',
        reviewPrompt:
          "Act as a Wipro NLTH aptitude trainer testing Time, Speed and Distance. Cover: the core formula, unit conversion (km/h to m/s using 5/18), average speed for equal distances (harmonic mean), relative speed for same and opposite directions, trains crossing poles/platforms/each other, and boats & streams (upstream/downstream). Ask ONE exam-style question at a time, wait for my answer, then show the shortcut. Escalate difficulty. End with a score out of 10 and which problem types to practice.",
        questions: [
          q('ts1', 'To convert 72 km/h to m/s, multiply by:', ['18/5', '5/18', '3.6', '1000/60'], 1, 'km/h to m/s uses factor 5/18, so 72 * 5/18 = 20 m/s.'),
          q('ts2', 'A car covers 150 km in 3 hours. Its speed is:', ['45 km/h', '50 km/h', '55 km/h', '60 km/h'], 1, 'Speed = 150/3 = 50 km/h.'),
          q('ts3', 'A train 120 m long crosses a pole in 6 seconds. Its speed is:', ['15 m/s', '20 m/s', '24 m/s', '12 m/s'], 1, 'Speed = 120/6 = 20 m/s.'),
          q('ts4', 'Two trains move toward each other at 40 and 60 km/h. Their relative speed is:', ['20 km/h', '100 km/h', '50 km/h', '120 km/h'], 1, 'Opposite directions add: 40 + 60 = 100 km/h.'),
          q('ts5', 'A boat goes 20 km/h in still water; the stream is 5 km/h. Downstream speed is:', ['15 km/h', '25 km/h', '20 km/h', '100 km/h'], 1, 'Downstream = boat + stream = 20 + 5 = 25 km/h.'),
          q('ts6', 'If a person travels half the distance at 30 km/h and half at 60 km/h, the average speed is:', ['45 km/h', '40 km/h', '50 km/h', '36 km/h'], 1, 'For equal distances average = 2*30*60/(30+60) = 3600/90 = 40 km/h.'),
          q('ts7', 'A 150 m train crosses a 350 m platform in 25 s. Its speed is:', ['18 m/s', '20 m/s', '22 m/s', '25 m/s'], 1, 'Total distance = 500 m over 25 s = 20 m/s.'),
          q('ts8', 'A boat takes 2 h upstream and 1 h downstream for the same distance. If stream = 3 km/h, the boat speed in still water is:', ['6 km/h', '9 km/h', '12 km/h', '15 km/h'], 1, 'Up:Down speed ratio 1:2; (b-3):(b+3)=1:2 → 2b-6=b+3 → b=9 km/h.'),
          q('ts9', 'A man walks at 5 km/h and covers a distance in 4 h. To cover it in 2 h he must walk at:', ['8 km/h', '10 km/h', '12 km/h', '15 km/h'], 1, 'Distance = 20 km; 20/2 = 10 km/h.'),
          q('ts10', 'Two trains of length 100 m and 150 m move in the same direction at 50 and 30 km/h. Time to cross each other:', ['30 s', '45 s', '45.5 s', '50 s'], 1, 'Relative speed 20 km/h = 50/9 m/s; total length 250 m; time = 250/(50/9) = 45 s.')
        ]
      },

      /* ---------- 4. Time & Work ---------- */
      {
        id: 'apt-work',
        code: 'APT-04',
        name: 'Time & Work',
        description: 'Work rate, pipes & cisterns, efficiency.',
        reviewPrompt:
          "You are a TCS NQT aptitude trainer testing Time and Work. Cover: the unitary/LCM method for work, combined work rates, efficiency and the inverse relation between people and time, men-days problems, work done in parts (someone leaves partway), and pipes & cisterns (inlets positive, outlets negative). Ask ONE exam-style question at a time, wait for my answer, then teach the LCM shortcut. Increase difficulty. End with a score out of 10 and which patterns I should drill.",
        questions: [
          q('wk1', 'A can do a job in 10 days, B in 15 days. Together they finish in:', ['5 days', '6 days', '7 days', '8 days'], 1, 'Rates 1/10 + 1/15 = 1/6, so together 6 days.'),
          q('wk2', 'If 8 men build a wall in 10 days, how long do 16 men take?', ['20 days', '5 days', '8 days', '10 days'], 1, 'Men and time are inversely proportional: 8*10/16 = 5 days.'),
          q('wk3', 'A pipe fills a tank in 6 h; a drain empties it in 12 h. With both open, time to fill is:', ['4 h', '12 h', '8 h', '18 h'], 1, 'Net rate = 1/6 - 1/12 = 1/12, so 12 hours.'),
          q('wk4', 'A is twice as efficient as B. If B alone takes 18 days, A alone takes:', ['9 days', '36 days', '12 days', '6 days'], 0, 'Twice the efficiency → half the time = 9 days.'),
          q('wk5', 'A and B finish work in 12 days; A alone in 20 days. B alone takes:', ['30 days', '24 days', '15 days', '40 days'], 0, '1/B = 1/12 - 1/20 = (5-3)/60 = 2/60 = 1/30, so 30 days.'),
          q('wk6', '6 men or 8 women can do a work in 24 days. How long will 6 men and 8 women together take?', ['12 days', '16 days', '10 days', '18 days'], 0, '6 men and 8 women each do the work in 24 days, so together they work at twice the rate: 24/2 = 12 days.'),
          q('wk7', 'A does 1/3 of a work in 5 days. The whole work alone takes:', ['10 days', '15 days', '12 days', '20 days'], 1, 'If 1/3 takes 5 days, the full work takes 15 days.'),
          q('wk8', 'Two pipes fill a tank in 20 and 30 minutes. Together they fill it in:', ['10 min', '12 min', '15 min', '25 min'], 1, '1/20 + 1/30 = 5/60 = 1/12, so 12 minutes.'),
          q('wk9', '15 men complete a job in 16 days. After 4 days, 5 more men join. The remaining work finishes in:', ['9 days', '12 days', '8 days', '10 days'], 0, 'Total 240 man-days; done 60; left 180 with 20 men = 9 days.'),
          q('wk10', 'A can do a work in 24 days. He works 6 days then leaves. Fraction of work left:', ['1/4', '3/4', '1/3', '2/3'], 1, 'In 6 days he does 6/24 = 1/4, so 3/4 is left.')
        ]
      },

      /* ---------- 5. Number System ---------- */
      {
        id: 'apt-number',
        code: 'APT-05',
        name: 'Number System',
        description: 'Divisibility, LCM/HCF, remainders, factors.',
        reviewPrompt:
          "Act as an Infosys InfyTQ aptitude trainer testing Number System. Cover: divisibility rules (2,3,4,5,6,8,9,11), HCF and LCM (and the product = HCF*LCM relation), remainder problems and the remainder theorem, unit-digit/cyclicity of powers, number of factors from prime factorization, and finding the largest/smallest number with given remainder conditions. Ask ONE exam-style question at a time, wait for my answer, then teach the trick. Increase difficulty. End with a score out of 10 and weak sub-topics.",
        questions: [
          q('ns1', 'A number is divisible by 9 if:', ['Its last digit is 9', 'The sum of its digits is divisible by 9', 'It is even', 'It ends in 0'], 1, 'The divisibility rule for 9 checks whether the digit sum is divisible by 9.'),
          q('ns2', 'The HCF of 12 and 18 is:', ['2', '3', '6', '36'], 2, 'Common factors of 12 and 18: highest is 6.'),
          q('ns3', 'The LCM of 4, 6, and 8 is:', ['12', '24', '48', '16'], 1, 'LCM(4,6,8) = 24.'),
          q('ns4', 'The unit digit of 7^72 is:', ['1', '7', '9', '3'], 0, 'Powers of 7 cycle 7,9,3,1 with period 4; 72 mod 4 = 0 → last in cycle = 1.'),
          q('ns5', 'If HCF of two numbers is 8 and LCM is 96, and one number is 32, the other is:', ['24', '16', '12', '48'], 0, 'Product = HCF*LCM = 8*96 = 768; other = 768/32 = 24.'),
          q('ns6', 'The remainder when 17^23 is divided by 16 is:', ['0', '1', '15', '7'], 1, '17 ≡ 1 (mod 16), so 17^23 ≡ 1^23 = 1.'),
          q('ns7', 'How many factors does 36 have?', ['6', '8', '9', '12'], 2, '36 = 2^2 * 3^2; number of factors = (2+1)(2+1) = 9.'),
          q('ns8', 'A number divisible by both 3 and 4 is always divisible by:', ['7', '12', '6 only', '24'], 1, 'Since 3 and 4 are coprime, the number is divisible by 3*4 = 12.'),
          q('ns9', 'The largest 3-digit number divisible by 7 is:', ['994', '997', '999', '991'], 0, '999/7 = 142.71; 142*7 = 994, the largest 3-digit multiple of 7.'),
          q('ns10', 'The smallest number which when divided by 5, 6, 8 leaves remainder 2 in each case is:', ['122', '120', '118', '242'], 0, 'LCM(5,6,8)=120; required number = 120 + 2 = 122.')
        ]
      },

      /* ---------- 6. Ratio, Proportion & Mixtures ---------- */
      {
        id: 'apt-ratio',
        code: 'APT-06',
        name: 'Ratio, Proportion & Mixtures',
        description: 'Direct/inverse proportion, alligation.',
        reviewPrompt:
          "You are a TCS aptitude trainer testing Ratio, Proportion and Mixtures. Cover: simplifying and combining ratios, dividing a quantity in a given ratio, direct vs inverse proportion, the rule of three, the alligation/mixture rule (and replacement problems), and ratio of ages/incomes. Ask ONE exam-style question at a time, wait for my answer, then show the alligation cross method where relevant. Increase difficulty. End with a score out of 10 and which sub-types I should practice.",
        questions: [
          q('rt1', 'If A:B = 2:3 and B:C = 4:5, then A:B:C is:', ['2:3:5', '8:12:15', '2:12:5', '8:3:5'], 1, 'Make B common: A:B=8:12, B:C=12:15 → 8:12:15.'),
          q('rt2', 'Divide 600 in the ratio 2:3. The larger part is:', ['240', '360', '300', '400'], 1, 'Total parts 5; larger = 3/5 * 600 = 360.'),
          q('rt3', 'If 5 pens cost 60, the cost of 8 pens is:', ['80', '96', '100', '90'], 1, 'Unit cost 12; 8 pens = 96.'),
          q('rt4', 'In what ratio must water (free) be mixed with milk costing 12/L to sell the mixture at 9/L?', ['1:3', '1:4', '3:1', '1:2'], 0, 'By alligation around mean 9: water gets (12-9)=3, milk gets (9-0)=9, so water:milk = 3:9 = 1:3.'),
          q('rt5', 'Two numbers are in ratio 3:5 and their sum is 64. The smaller number is:', ['24', '40', '32', '20'], 0, 'Parts 8; smaller = 3/8 * 64 = 24.'),
          q('rt6', 'If x is inversely proportional to y, and x=4 when y=6, then x when y=8 is:', ['3', '5.33', '2', '12'], 0, 'xy constant = 24; x = 24/8 = 3.'),
          q('rt7', 'A 40 L mixture has milk and water in ratio 3:1. How much water must be added to make the ratio 3:2?', ['10 L', '8 L', '6 L', '5 L'], 0, 'Milk 30, water 10; keep milk 30 and set 30:(10+w)=3:2 → 60=30+3w → w=10 L.'),
          q('rt8', 'The ratio of ages of A and B is 4:5. After 5 years it becomes 5:6. A\'s present age is:', ['20', '25', '15', '30'], 0, '(4x+5)/(5x+5)=5/6 → 24x+30=25x+25 → x=5 → A=20.'),
          q('rt9', 'Equal volumes of two mixtures with milk:water 5:2 and 7:6 are combined. The new milk:water ratio is:', ['57:34', '12:8', '7:5', '3:2'], 0, 'Per unit: milk 5/7+7/13 = 114/91, water 2/7+6/13 = 68/91, so ratio 114:68 = 57:34.'),
          q('rt10', 'If a:b = 2:3, the value of (3a+2b):(2a+3b) is:', ['12:13', '13:12', '5:6', '6:5'], 0, 'Take a=2,b=3: (6+6):(4+9) = 12:13.')
        ]
      },

      /* ---------- 7. Logical Reasoning ---------- */
      {
        id: 'apt-logical',
        code: 'APT-07',
        name: 'Logical Reasoning',
        description: 'Series, coding-decoding, blood relations, directions, seating arrangement.',
        reviewPrompt:
          "Act as a Wipro/Infosys reasoning trainer testing Logical Reasoning. Cover: number and letter series, coding-decoding (letter shifts and substitution), blood relations, direction sense (distance and final direction), and seating arrangements (linear and circular). Ask ONE exam-style question at a time, wait for my answer, then explain the logic step by step. Increase difficulty gradually. End with a score out of 10 and which reasoning types I should drill.",
        questions: [
          q('lr1', 'Find the next term: 2, 6, 12, 20, 30, ?', ['40', '42', '36', '44'], 1, 'Differences increase by 2 (4,6,8,10,12); 30+12 = 42.'),
          q('lr2', 'If CAT is coded as DBU, then DOG is coded as:', ['EPH', 'EPF', 'FQI', 'DPH'], 0, 'Each letter shifts +1: D→E, O→P, G→H, giving EPH.'),
          q('lr3', 'Pointing to a man, a woman says "He is the son of my mother\'s only son." The man is the woman\'s:', ['Brother', 'Nephew', 'Son', 'Cousin'], 1, 'Her mother\'s only son is her brother; his son is her nephew.'),
          q('lr4', 'A man walks 3 km north, turns right and walks 4 km. How far is he from start?', ['5 km', '7 km', '1 km', '4 km'], 0, 'Right-angle path: √(3²+4²) = 5 km.'),
          q('lr5', 'Find the odd one out: 3, 5, 7, 9, 11', ['3', '9', '11', '5'], 1, 'All are prime except 9 (which is 3×3).'),
          q('lr6', 'Complete the series: A, C, F, J, ?', ['O', 'N', 'M', 'P'], 0, 'Gaps grow by 1 (+2,+3,+4,+5): J + 5 = O.'),
          q('lr7', 'If "+" means ÷, "÷" means ×, "×" means -, "-" means +, then 16 + 4 ÷ 2 - 8 = ?', ['8', '16', '0', '24'], 1, 'Translate: 16÷4×2+8 = 4×2+8 = 8+8 = 16.'),
          q('lr8', 'In a row of 40, A is 11th from left and B is 31st from left. How many are between them?', ['19', '20', '18', '21'], 0, 'Between positions 11 and 31 there are 31-11-1 = 19 people.'),
          q('lr9', 'Daughter of my grandfather\'s only son is my:', ['Sister', 'Aunt', 'Cousin', 'Niece'], 0, 'Grandfather\'s only son is my father; his daughter is my sister.'),
          q('lr10', 'Find the missing number: 7, 14, 28, 56, ?', ['84', '112', '98', '120'], 1, 'Each term doubles; 56 × 2 = 112.')
        ]
      },

      /* ---------- 8. Verbal Ability ---------- */
      {
        id: 'apt-verbal',
        code: 'APT-08',
        name: 'Verbal Ability',
        description: 'Reading comprehension, sentence correction, fill in the blanks, para jumbles.',
        reviewPrompt:
          "You are an English/Verbal Ability trainer preparing me for TCS/Infosys/Wipro placement tests. Cover: subject-verb agreement, tenses, articles and prepositions, common sentence-correction errors, synonyms/antonyms, fill-in-the-blanks with the right word, and para-jumble sequencing logic. Ask ONE exam-style question at a time, wait for my answer, then explain the grammar rule clearly. Increase difficulty. End with a score out of 10 and which grammar areas I should revise.",
        questions: [
          q('vb1', 'Choose the correctly written sentence:', ['Each of the boys have a book.', 'Each of the boys has a book.', 'Each of the boys are having book.', 'Each of the boy have books.'], 1, '"Each" is singular, so it takes the singular verb "has".'),
          q('vb2', 'Fill in the blank: She has been working here ___ 2015.', ['for', 'since', 'from', 'by'], 1, '"Since" is used with a point in time (2015); "for" is used with a duration.'),
          q('vb3', 'Choose the synonym of "ABUNDANT":', ['Scarce', 'Plentiful', 'Empty', 'Rare'], 1, 'Abundant means existing in large quantities, i.e. plentiful.'),
          q('vb4', 'Identify the error: "The team are playing well today."', ['team', 'are', 'playing', 'No error'], 1, 'A collective noun acting as a unit takes a singular verb: "The team is playing".'),
          q('vb5', 'Choose the antonym of "BENEVOLENT":', ['Kind', 'Generous', 'Cruel', 'Helpful'], 2, 'Benevolent means kind/generous; its opposite is cruel.'),
          q('vb6', 'Fill in the blank: He is good ___ mathematics.', ['in', 'at', 'on', 'with'], 1, 'The correct collocation is "good at" a subject or skill.'),
          q('vb7', 'Choose the correct sentence:', ['Neither of them were present.', 'Neither of them was present.', 'Neither of them are present.', 'Neither of them have present.'], 1, '"Neither" is singular and takes "was".'),
          q('vb8', 'The correctly spelled word is:', ['Recieve', 'Receive', 'Receeve', 'Receve'], 1, 'The rule "i before e except after c" gives the correct spelling "receive".'),
          q('vb9', 'Fill in the blank: If I ___ rich, I would travel the world.', ['am', 'was', 'were', 'will be'], 2, 'The second conditional (hypothetical) uses "were" for all subjects: "If I were rich".'),
          q('vb10', 'Choose the word that best completes: The lecture was so ___ that many students fell asleep.', ['exciting', 'tedious', 'brief', 'lively'], 1, 'Falling asleep implies boredom, so "tedious" (boring) fits the context.')
        ]
      },

      /* ---------- 9. Data Interpretation ---------- */
      {
        id: 'apt-di',
        code: 'APT-09',
        name: 'Data Interpretation',
        description: 'Bar/line/pie chart reading, table analysis.',
        reviewPrompt:
          "Act as a TCS/Wipro Data Interpretation trainer. Pose self-contained DI questions (state the small data set in text — a table, pie-chart percentages, or bar values) and test: reading values, computing totals and averages, percentage share, ratio between categories, percentage growth between periods, and combined-condition questions. Ask ONE question at a time, wait for my answer, then show the quick calculation. Increase difficulty. End with a score out of 10 and which DI skills to sharpen.",
        questions: [
          q('di1', 'A pie chart shows expenses: Rent 30%, Food 25%, Travel 15%, Others 30%. If total is 20000, Food expense is:', ['4000', '5000', '6000', '3000'], 1, '25% of 20000 = 5000.'),
          q('di2', 'Sales (in units): Jan 100, Feb 150, Mar 200, Apr 50. The average monthly sales is:', ['100', '125', '150', '120'], 1, 'Sum = 500 over 4 months = 125.'),
          q('di3', 'A company\'s profit grew from 200 to 250. The percentage growth is:', ['20%', '25%', '50%', '30%'], 1, 'Growth = 50/200 *100 = 25%.'),
          q('di4', 'In a bar chart, product A sold 400 and product B sold 500. A is what percent of B?', ['80%', '125%', '90%', '20%'], 0, '400/500 *100 = 80%.'),
          q('di5', 'Pie chart total students 720; Science is 25%. Number of Science students:', ['180', '200', '160', '240'], 0, '25% of 720 = 180.'),
          q('di6', 'Revenue: Q1 120, Q2 180, Q3 150, Q4 150. Q2 contributes what percent of the year?', ['25%', '30%', '35%', '20%'], 1, 'Total 600; Q2 = 180/600 = 30%.'),
          q('di7', 'A table shows marks: Math 80, Physics 70, Chemistry 90 out of 100 each. The overall percentage is:', ['75%', '80%', '85%', '70%'], 1, 'Total 240/300 = 80%.'),
          q('di8', 'Population: 2020 = 50000, 2021 = 55000. The percentage increase is:', ['5%', '10%', '15%', '11%'], 1, 'Increase 5000/50000 = 10%.'),
          q('di9', 'Pie chart: Marketing 40%, R&D 35%, Admin 25% of a 8 lakh budget. R&D gets:', ['2.8 lakh', '3.2 lakh', '2.0 lakh', '3.5 lakh'], 0, '35% of 8 lakh = 2.8 lakh.'),
          q('di10', 'Items produced: Mon 200, Tue 250, Wed 0 (holiday), Thu 300, Fri 250. Average over the 5 days is:', ['200', '250', '240', '220'], 0, 'Sum = 1000 over 5 days = 200.')
        ]
      },

      /* ---------- 10. Programming Logic ---------- */
      {
        id: 'apt-proglogic',
        code: 'APT-10',
        name: 'Programming Logic',
        description: 'Flowcharts, pseudo-code MCQs, algorithm tracing, output prediction.',
        reviewPrompt:
          "You are an Infosys InfyTQ / TCS NQT trainer testing Programming Logic and pseudo-code. Cover: tracing loops and computing final values, swapping without a temp variable, conditionals and boolean logic, recursion (factorial/Fibonacci) trace, time-complexity intuition (O(1), O(n), O(n^2), O(log n)), and flowchart-to-output reasoning. Ask ONE language-agnostic pseudo-code question at a time, wait for my answer, then trace the logic step by step. Increase difficulty. End with a score out of 10 and weak areas.",
        questions: [
          q('pg1', 'What is the output?\n\nx = 5; y = 10;\nx = x + y; y = x - y; x = x - y;\nprint(x, y);', ['5 10', '10 5', '15 5', '5 5'], 1, 'This is the no-temp swap: x and y are exchanged, giving 10 5.'),
          q('pg2', 'A loop runs: for i = 1 to n, doing constant work. Its time complexity is:', ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'], 1, 'A single loop over n elements with constant work per step is O(n).'),
          q('pg3', 'What does this print?\n\nsum = 0;\nfor i = 1 to 5: sum = sum + i;\nprint(sum);', ['10', '15', '20', '25'], 1, '1+2+3+4+5 = 15.'),
          q('pg4', 'A nested loop, each from 1 to n, has time complexity:', ['O(n)', 'O(n^2)', 'O(2n)', 'O(log n)'], 1, 'Two nested loops over n give n*n iterations = O(n^2).'),
          q('pg5', 'What is factorial(4) where factorial(n) = n * factorial(n-1), factorial(0)=1?', ['12', '24', '16', '4'], 1, '4! = 4*3*2*1 = 24.'),
          q('pg6', 'What is the final value of count?\n\ncount = 0;\nfor i = 1 to 10: if i % 2 == 0: count = count + 1;', ['4', '5', '6', '10'], 1, 'Even numbers 2,4,6,8,10 → count increments 5 times.'),
          q('pg7', 'Binary search on a sorted array of n elements has complexity:', ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], 1, 'Binary search halves the search space each step, giving O(log n).'),
          q('pg8', 'What is the output?\n\na = 2; b = 3;\nif (a > b) print("A"); else if (a == b) print("E"); else print("B");', ['A', 'E', 'B', 'Nothing'], 2, 'Since 2 is not > 3 and not == 3, the else branch prints B.'),
          q('pg9', 'How many times does this loop execute?\n\ni = 1;\nwhile (i < 16): i = i * 2;', ['3', '4', '5', '16'], 1, 'i goes 1,2,4,8 then 16 stops the loop; the body runs 4 times (i becomes 2,4,8,16).'),
          q('pg10', 'What is printed?\n\nfor i = 1 to 3:\n  for j = 1 to 3:\n    if i == j: print(i);', ['1 2 3', '1 1 1', '3 3 3', '1 2 3 1 2 3'], 0, 'The inner condition i==j is true once per i (diagonal), printing 1, 2, 3.')
        ]
      }
    ]
  };

  /* ============================================================
     v1.1 EXPANSION — new topics + Java track reorder
     Existing topic objects are referenced by id and never mutated;
     only the array ORDER changes (the UI renders from this order).
     ============================================================ */
  var javaById = {};
  java.topics.forEach(function (t) {
    javaById[t.id] = t;
  });

  /* ---------- NEW: DSA — Arrays & Strings ---------- */
  var tDsaArrays = {
    id: 'java-dsa-arrays',
    code: 'JAVA-11',
    name: 'DSA — Arrays & Strings',
    description:
      'Array manipulation, string operations, two-pointer technique, sliding window — the most tested coding topic in TCS Digital.',
    reviewPrompt:
      "You are a TCS Digital coding interviewer. Quiz me interactively on DSA — Arrays & Strings at Digital difficulty. Cover the two-pointer technique (pair sum, reversing), the sliding-window pattern, in-place array rotation, duplicate detection, anagram checks, Java String methods (charAt, substring, indexOf, length), StringBuilder vs String in loops, and time/space complexity of array operations. Ask ONE question at a time — mix concept MCQs with 'predict the output' Java snippets. WAIT for my answer before revealing whether I'm right, then explain briefly. Start moderate and escalate to edge cases (null handling, off-by-one, immutability). After 10 questions give me a score out of 10 and my weak areas.",
    questions: [
      q('da1', 'What is the output?\n\nint[] a = {2, 4, 6, 8};\nint s = 0;\nfor (int i = 0; i < a.length; i++) s += a[i] * i;\nSystem.out.println(s);', ['40', '20', '36', '60'], 0, 'Each element is weighted by its index: 0 + 4 + 12 + 24 = 40.'),
      q('da2', 'Using two pointers on a sorted array to find a pair summing to a target, if the current pair sum is GREATER than the target, you should:', ['Move the left pointer right', 'Move the right pointer left', 'Move both pointers inward', 'Restart from the beginning'], 1, 'A sum that is too large must be reduced, so move the right pointer left to a smaller value.'),
      q('da3', 'What is the output?\n\nint[] a = {1,2,3,4,5};\nint i=0, j=a.length-1;\nwhile(i<j){int t=a[i];a[i]=a[j];a[j]=t;i++;j--;}\nSystem.out.println(a[0]+""+a[4]);', ['51', '15', '13', '35'], 0, 'The two-pointer swap reverses the array, so a[0] becomes 5 and a[4] becomes 1.'),
      q('da4', 'What is the output?\n\nString s = "placement";\nSystem.out.println(s.substring(2, 5));', ['ace', 'lac', 'cem', 'lace'], 0, 'substring(2,5) returns characters at indices 2,3,4 — "ace".'),
      q('da5', 'The most efficient standard way to check whether two strings are anagrams is to:', ['Compare their lengths only', 'Sort both and compare, or compare character-frequency counts', 'Reverse one and compare', 'Compare their hashCodes directly'], 1, 'Anagrams share identical character frequencies, so sorting both or counting characters confirms it.'),
      q('da6', 'Why is StringBuilder preferred over String concatenation inside a large loop?', ['String cannot be concatenated in loops', 'Each String concatenation creates a new object (O(n^2) overall); StringBuilder mutates in place', 'StringBuilder always uses less memory regardless of use', 'String is not thread-safe'], 1, 'String is immutable, so each += allocates a new object (O(n^2) total), whereas StringBuilder appends in place.'),
      q('da7', 'What is the output?\n\nint[] a = {1,3,3,5,5,5};\nint c = 0;\nfor(int i=1;i<a.length;i++) if(a[i]==a[i-1]) c++;\nSystem.out.println(c);', ['2', '3', '5', '6'], 1, 'Adjacent equal pairs occur at the second 3 and the two repeated 5s, giving a count of 3.'),
      q('da8', 'What is the output?\n\nString[] arr = new String[3];\nSystem.out.println(arr[0].length());', ['0', 'null', 'NullPointerException', 'Compile error'], 2, 'Object-array elements default to null, so calling length() on arr[0] throws NullPointerException.'),
      q('da9', 'What is the output?\n\nint[][] m = {{1,2,3},{4,5,6}};\nSystem.out.println(m[1][2] + m[0][1]);', ['8', '7', '9', '5'], 0, 'm[1][2] is 6 and m[0][1] is 2, so the sum printed is 8.'),
      q('da10', 'What is the output?\n\nString a = "hi";\nString b = "hi";\nString c = new String("hi");\nSystem.out.println((a==b) + " " + (a==c));', ['true true', 'true false', 'false false', 'false true'], 1, 'String literals share the intern pool (a==b is true), but new String() creates a distinct object (a==c is false).')
    ]
  };

  /* ---------- NEW: DSA — Linked Lists, Stacks & Queues ---------- */
  var tDsaLists = {
    id: 'java-dsa-lists',
    code: 'JAVA-12',
    name: 'DSA — Linked Lists, Stacks & Queues',
    description:
      'Pointer-based data structures — traversal, reversal, cycle detection, and stack/queue operations frequently tested in Digital coding rounds.',
    reviewPrompt:
      "Act as a placement coding interviewer (TCS Digital / Infosys SP). Quiz me interactively on Linked Lists, Stacks & Queues. Cover singly linked list traversal and head/tail insertion, iterative reversal (prev/curr/next), Floyd's cycle detection, stack push/pop and queue enqueue/dequeue output prediction, array-based stack index tracking, infix-to-postfix operator precedence, LinkedList vs ArrayList trade-offs, and Java's ArrayDeque. Ask ONE question at a time — mix concept MCQs with Java output snippets. WAIT for my answer, then explain. Escalate difficulty. End with a score out of 10 and what to revise.",
    questions: [
      q('dl1', 'In a singly linked list, inserting a new node at the head requires:', ['Traversing to the end first', "Setting the new node's next to the current head, then updating head", 'Updating the tail pointer only', 'Sorting the list first'], 1, 'Head insertion points the new node at the old head and reassigns head — an O(1) operation.'),
      q('dl2', 'While iteratively reversing a singly linked list, the three pointers typically used are:', ['prev, curr, next', 'head, tail, mid', 'left, right, pivot', 'top, bottom, temp'], 0, 'Iterative reversal tracks prev, curr and next so each node is relinked without losing the remaining list.'),
      q('dl3', "Floyd's cycle-detection algorithm detects a loop in a linked list by:", ['Counting all nodes once', 'Using slow (1 step) and fast (2 steps) pointers that meet inside a cycle', 'Marking every visited node with extra memory', 'Reversing the list twice'], 1, "Floyd's tortoise-and-hare advances one pointer twice as fast; if a cycle exists the two pointers eventually meet."),
      q('dl4', 'A stack performs: push(1), push(2), push(3), pop(), push(4), pop(), pop(). In what order are values popped?', ['3 4 2', '1 2 3', '3 2 4', '4 3 2'], 0, 'LIFO: pop returns 3, then after pushing 4 it returns 4, then 2 — order 3 4 2.'),
      q('dl5', 'A queue undergoes: enqueue(1), enqueue(2), dequeue(), enqueue(3), dequeue(). What value does the SECOND dequeue return?', ['1', '2', '3', 'Queue is empty'], 1, 'FIFO: the first dequeue removes 1, so the second removes the next oldest element, 2.'),
      q('dl6', 'In an array-based stack with top initialized to -1, after three push operations the value of top is:', ['0', '2', '3', '-1'], 1, 'top starts at -1 and increments before each push, so after three pushes top is 2.'),
      q('dl7', 'When converting infix to postfix, on reading an operator with LOWER precedence than the one on top of the stack you:', ['Push it immediately', 'Pop higher/equal-precedence operators to output, then push the new one', 'Discard the operator', 'Reverse the whole expression'], 1, 'Operators of higher or equal precedence are popped to output before the lower-precedence operator is pushed.'),
      q('dl8', 'Which statement about Java\'s LinkedList vs ArrayList is correct?', ['ArrayList gives O(1) random index access (get); LinkedList needs O(n) traversal', 'LinkedList uses contiguous memory', 'ArrayList is always faster for head insertions', 'LinkedList supports O(1) random access by index'], 0, 'ArrayList is backed by a contiguous array (O(1) get), whereas LinkedList must traverse nodes (O(n)).'),
      q('dl9', "Java's ArrayDeque can serve as both a stack and a queue because it supports:", ['Only FIFO operations', 'Insertion and removal at both ends', 'Indexed random access like an array', 'Automatic sorting of elements'], 1, 'A deque (double-ended queue) allows add/remove at both ends, covering both LIFO (stack) and FIFO (queue) use.'),
      q('dl10', 'What is the output?\n\nDeque<Integer> st = new ArrayDeque<>();\nst.push(10); st.push(20); st.push(30);\nSystem.out.println(st.pop() + st.peek());', ['50', '60', '40', '30'], 0, 'pop() removes and returns 30, then peek() reads the new top 20, so 30 + 20 = 50 is printed.')
    ]
  };

  /* ---------- NEW: DSA — Searching & Sorting ---------- */
  var tDsaSorting = {
    id: 'java-dsa-sorting',
    code: 'JAVA-13',
    name: 'DSA — Searching & Sorting',
    description:
      'Binary search, bubble/merge/quick sort — complexity comparison and tracing output are standard in TCS Digital and Infosys SP technical rounds.',
    reviewPrompt:
      "You are a TCS Digital interviewer testing Searching & Sorting. Quiz me interactively: binary search mid-calculation and worst-case comparisons, linear search best/average/worst cases, bubble-sort pass-by-pass tracing, selection and insertion sort mechanics, merge-sort divide-and-merge complexity, quicksort pivot and worst case, the O(n)/O(log n)/O(n log n)/O(n^2) hierarchy, space complexity, and which sorts are stable/in-place. Ask ONE question at a time — mix complexity MCQs with step-by-step tracing. WAIT for my answer, then explain. Escalate difficulty and finish with a score out of 10.",
    questions: [
      q('ds1', 'Binary search repeatedly halves the search space. For a sorted array of 1000 elements, the approximate worst-case number of comparisons is:', ['10', '100', '500', '1000'], 0, 'Binary search is O(log2 n); log2(1000) is about 10 comparisons in the worst case.'),
      q('ds2', 'The safest way to compute the midpoint in binary search to avoid integer overflow is:', ['(low + high) / 2', 'low + (high - low) / 2', '(high - low) / 2', 'high / 2 + low / 2'], 1, 'low + (high - low)/2 avoids the overflow that (low + high) can cause for very large indices.'),
      q('ds3', 'Linear search on an UNSORTED array of n elements has best, average and worst case respectively:', ['O(1), O(n), O(n)', 'O(n), O(n), O(n)', 'O(1), O(log n), O(n)', 'O(1), O(1), O(n)'], 0, 'The best case finds it first (O(1)); the average and worst scan about half or all elements (O(n)).'),
      q('ds4', 'What is the array after ONE pass of bubble sort (ascending) on {5, 1, 4, 2}?', ['{1, 4, 2, 5}', '{1, 2, 4, 5}', '{4, 1, 2, 5}', '{5, 4, 2, 1}'], 0, 'One pass bubbles the largest element (5) to the end, yielding {1, 4, 2, 5}.'),
      q('ds5', 'Selection sort works by:', ['Repeatedly selecting the minimum of the unsorted part and placing it at the front', 'Inserting each element into a sorted prefix', 'Repeatedly swapping adjacent out-of-order elements', 'Dividing the array and merging subarrays'], 0, 'Selection sort finds the minimum of the remaining unsorted region and swaps it into the next position.'),
      q('ds6', 'Insertion sort runs closest to its best case O(n) when the input array is:', ['Reverse sorted', 'Already nearly sorted', 'Completely random', 'Entirely duplicates of one value'], 1, 'On nearly sorted data very few shifts are needed, so insertion sort approaches O(n).'),
      q('ds7', "Merge sort's time complexity in ALL cases (best, average, worst) is:", ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'], 1, 'Merge sort always splits into halves (log n levels) and merges in O(n), giving a consistent O(n log n).'),
      q('ds8', 'Quicksort degrades to O(n^2) in the worst case when:', ['The array is empty', 'The pivot is repeatedly the smallest or largest element (e.g. sorted input with a poor pivot)', 'The array contains duplicate values', 'It is run on a linked list'], 1, 'A consistently extreme pivot produces maximally unbalanced partitions of size n-1, giving O(n^2).'),
      q('ds9', 'Recursive merge sort uses extra space mainly because of:', ['The auxiliary array needed by the merge step (O(n))', 'It uses no extra space at all', 'Storing only the pivot element', 'Hashing every element'], 0, 'Merge sort needs an O(n) auxiliary array to merge halves, unlike in-place iterative sorts.'),
      q('ds10', 'Which sorting algorithm is BOTH stable and in-place?', ['Selection sort', 'Insertion sort', 'Quick sort', 'Merge sort'], 1, 'Insertion sort preserves the order of equal elements (stable) and sorts within the array (in-place).')
    ]
  };

  /* ---------- NEW: DSA — Recursion & Problem Solving ---------- */
  var tDsaRecursion = {
    id: 'java-dsa-recursion',
    code: 'JAVA-14',
    name: 'DSA — Recursion & Problem Solving',
    description:
      'Recursive thinking, base cases, call stack tracing — TCS Digital Advanced Coding section heavily tests recursion-based problems.',
    reviewPrompt:
      "Act as a TCS Digital Advanced Coding interviewer testing Recursion & Problem Solving. Quiz me interactively: tracing factorial and Fibonacci output and call counts, call-stack depth and StackOverflowError, identifying base cases, recursion vs iteration trade-offs, the Tower of Hanoi move formula, recursive power and string-reversal output, recursive binary search, and tail recursion. Ask ONE question at a time — mix concept MCQs with 'predict the output' recursive Java snippets. WAIT for my answer, then trace the recursion step by step. Escalate to edge cases. End with a score out of 10 and weak spots.",
    questions: [
      q('dr1', 'What is the output of f(5)?\n\nstatic int f(int n){ return n <= 1 ? 1 : n * f(n - 1); }', ['24', '120', '60', '125'], 1, 'f(5) = 5*4*3*2*1 = 120.'),
      q('dr2', 'For naive recursive Fibonacci fib(n)=fib(n-1)+fib(n-2) (with fib(0)=0, fib(1)=1), how many TOTAL calls to fib are made to compute fib(4)?', ['5', '7', '9', '16'], 2, 'The call tree has 1 + C(3) + C(2) = 1 + 5 + 3 = 9 total invocations for fib(4).'),
      q('dr3', 'A recursive function with no reachable base case will typically cause:', ['An infinite loop with no error', 'A StackOverflowError as the call stack grows unbounded', 'A compile-time error', 'A NullPointerException'], 1, 'Unbounded recursion keeps pushing stack frames until the JVM throws StackOverflowError.'),
      q('dr4', 'In a correct recursive function, the base case is responsible for:', ['Making the recursive call', 'Stopping recursion by returning a result without recursing further', 'Increasing the input size', 'Allocating the call stack'], 1, 'The base case terminates recursion by returning a direct answer instead of recursing.'),
      q('dr5', 'Compared with an equivalent iterative loop, recursion typically:', ['Always runs faster', 'Uses additional memory for call-stack frames', 'Cannot solve the same class of problems', 'Never needs a base case'], 1, 'Each recursive call adds a stack frame, so recursion generally uses more memory than a loop.'),
      q('dr6', 'The minimum number of moves to solve Tower of Hanoi with 5 disks is:', ['25', '31', '32', '63'], 1, 'Tower of Hanoi needs 2^n - 1 moves; for n = 5 that is 31.'),
      q('dr7', 'What is the output of p(2, 5)?\n\nstatic int p(int b, int e){ return e == 0 ? 1 : b * p(b, e - 1); }', ['10', '25', '32', '16'], 2, 'p(2,5) multiplies 2 by itself five times = 2^5 = 32.'),
      q('dr8', 'What does reverse("abc") return?\n\nString reverse(String s){ return s.isEmpty() ? s : reverse(s.substring(1)) + s.charAt(0); }', ['abc', 'cba', 'bca', 'cab'], 1, 'Each call appends the first character after reversing the rest, producing "cba".'),
      q('dr9', 'In recursive binary search, if the target is LARGER than the middle element, the next call searches:', ['The left half', 'The right half', 'The entire array again', 'Only the middle element'], 1, 'A target greater than the midpoint must lie in the right half, so the search recurses there.'),
      q('dr10', "A recursive call is 'tail recursive' when:", ['It calls itself exactly twice', 'The recursive call is the last operation performed in the function', 'It has no base case', 'It internally uses a loop'], 1, 'In tail recursion the recursive call is the final action, which allows it to be optimized into a loop.')
    ]
  };

  /* Re-sequence the Java Dev Track to the v1.1 roadmap order.
     Existing topics keep their content; only their position changes. */
  java.topics = [
    javaById['java-core'], //         1. Core Java Fundamentals
    javaById['java-oop'], //          2. OOP Concepts
    javaById['java-exceptions'], //   3. Exception Handling
    tDsaArrays, //                    4. DSA — Arrays & Strings (NEW)
    tDsaLists, //                     5. DSA — Linked Lists, Stacks & Queues (NEW)
    tDsaSorting, //                   6. DSA — Searching & Sorting (NEW)
    tDsaRecursion, //                 7. DSA — Recursion & Problem Solving (NEW)
    javaById['java-collections'], //  8. Java Collections Framework
    javaById['java-generics'], //     9. Generics
    javaById['java-streams'], //     10. Java Streams & Lambdas
    javaById['java-threads'], //     11. Multithreading Basics
    javaById['java-jdbc'], //        12. SQL & JDBC
    javaById['java-spring'], //      13. Spring Boot Basics
    javaById['java-rest'] //         14. REST API Design
  ];

  /* ============================================================
     Export
     ============================================================ */
  window.AppData = {
    passThreshold: 0.9, // 90% to master
    cooldownMs: 4 * 60 * 60 * 1000, // 4 hours
    reviewQuestionCount: 5,
    srSchedule: [1, 3, 7, 14, 30], // days after mastering
    tracks: {
      java: java,
      aptitude: aptitude
    }
  };
})();
