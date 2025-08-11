Arthas Basic Usage Guide (Docker Environment)
This guide walks you through how to download, attach, and debug a Java application running inside a Docker container using Alibaba's Arthas.

Step 0: Enter the Server
First, run your running terminal（Connected to Unimelb internal net）:
ssh ubuntu@oas12025.eng.unimelb.edu.au

Step 1: Enter the Container
First, list your running containers:
docker ps
Then enter the target container:
docker exec -it <your-container-name> bash

Step 2: Download Arthas
Inside the container, run:
curl -O https://arthas.aliyun.com/arthas-boot.jar
Step 3: Launch Arthas
Run the following command:
java -jar arthas-boot.jar
You’ll see a list of Java processes running inside the container:
Enter the corresponding number to attach to your target application.

Step 4: Common Debugging Commands
Purpose
Command Example
Description
Trace method execution time
trace com.example.MyService doSomething
Tracks the execution time of the method and shows a call tree.
Trace slow methods only
trace com.example.MyService doSomething '#cost > 100'
Only shows calls that take more than 100ms.
Watch method parameters & return
watch com.example.MyService doSomething "{params, returnObj}" -x 3
Displays method arguments and return value.
Print stack trace if exception
watch com.example.MyService doSomething '{throwExp}' -x 2 -e
Shows stack trace only when an exception is thrown.
Monitor method call frequency
monitor -c 5 com.example.MyService doSomething
Monitors execution stats every 5 seconds.
View all thread stack traces
thread
Lists all thread states and stack traces.
Find deadlocked threads
thread -b
Detects and prints deadlock threads.
View JVM GC, memory, and threads
jvm
Shows memory, GC, and thread usage overview.
View real-time system metrics
dashboard
Displays CPU, memory, GC, thread summary, and other live metrics.
List loaded classes
sc -d com.example.MyService
Shows matching loaded classes.
View classloader hierarchy
classloader
Lists all classloaders and loaded class counts.
Dump bytecode to local file
dump com.example.MyService
Saves the class bytecode to file.
Decompile a class
jad com.example.MyService
Shows the decompiled source of a loaded class.
Redefine class with updated bytecode
redefine /tmp/MyService.class
Reloads updated .class file into JVM without restarting.
Watch static methods
watch com.example.MyUtil staticMethod "{params, returnObj}" -x 2
Works for debugging utility classes.
Execute OGNL expressions
ognl '@java.lang.Math@random()'
Dynamically run Java code expressions.
Exit Arthas
quit
Leaves the Arthas shell.
Help with command syntax
help trace
Shows usage info for the trace command.


Step 5: Exit and Clean Up
To exit Arthas:
quit
To exit the container:
exit
(Optional) Clean up the Arthas jar:
rm -f /opt/arthas/arthas-boot.jar


