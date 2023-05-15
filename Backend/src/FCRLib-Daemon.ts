import { mdiCog } from "@mdi/js";

export interface Plugin {
  name: string;
  id: string;
  description: string;
  version: string; // Semantic versioning
  icon: string;
  iconIsMdi: boolean;
}

export interface Task {
  id: string;
  name: string;
  priority: number;
  plugin: Plugin; // The plugin that created the task. If null, will be classified as a "system" task (see SYSTEM_PLUGIN).
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'; // Tasks are deleted after being ran
  execute: (...args: any[]) => any;
}

let DAEMON_INTERVAL: number | null = null; // setInterval() returns a number
let TASK_QUEUE: Task[] = [];
let TASK_HISTORY: Task[] = [];

const SYSTEM_PLUGIN: Plugin = {
  name: "System",
  id: "system",
  description: "System tasks.",
  version: "1.0.0",
  icon: mdiCog,
  iconIsMdi: true
}

// I don't want other code to be able to modify the task queue, so I'm only sending a copy.
export function getTaskQueue() {
  const copyArray = [...TASK_QUEUE];
  return copyArray;
}

export function getTaskHistory() {
  const copyArray = [...TASK_HISTORY];
  return copyArray;
}

export function getDaemonIsRunning() {
  return DAEMON_INTERVAL !== null;
}

// Returns an array of all plugins that are currently running tasks without duplicate entries
export function getRunningPlugins() {
  const runningPlugins: Plugin[] = [];
  TASK_QUEUE.forEach(task => {
    if (!runningPlugins.includes(task.plugin)) {
      runningPlugins.push(task.plugin);
    }
  });
  return runningPlugins;
}

export function startDaemon(intervalMs: number = 100) {
  console.log(`FogFlightControl: DAEMON STARTUP REQUESTED
  Interval: ${intervalMs}ms`);

  if (DAEMON_INTERVAL) {
    console.warn('FogFlightControl: Daemon already running.');
    return;
  };
  // @ts-ignore
  DAEMON_INTERVAL = setInterval(() => {
    if (TASK_QUEUE.length === 0) {
      return;
    }
    
    // Sort the task queue by priority
    TASK_QUEUE.sort((a, b) => a.priority - b.priority);
    
    const task = TASK_QUEUE.shift();
    if (task) {
      task.status = 'RUNNING';
      try {
        task.execute();
        task.status = 'COMPLETED';
      } catch(e) {
        console.error(`FogFlightControl: Task ${task.id} failed with the following exception:\n\n${e}`);
        task.status = 'FAILED';
      } finally {
        TASK_HISTORY.push(task);
      }
    }
  
    // Update the priority of the remaining tasks
    TASK_QUEUE.forEach((task, index) => {
      task.priority = index;
    });
  }, intervalMs);

  console.log('FogFlightControl: Daemon started.');
}

export function stopDaemon(clearTasks: boolean = false) {
  console.log('FogFlightControl: DAEMON SHUTDOWN REQUESTED');
  if (DAEMON_INTERVAL) {
    clearTimeout(DAEMON_INTERVAL);
    DAEMON_INTERVAL = null;
    console.log('FogFlightControl: Daemon stopped.');
  }
  if (clearTasks) {
    TASK_QUEUE = [];
    console.log('FogFlightControl: Task queue cleared.');
  }
}

/**
 * @param name Name for the task.
 * @param priority Either a direct integer position or one of the following choices: "HIGHEST" | "HIGH" | "NORMAL" | "LOW" | "LOWEST".
 *  HIGHEST places the task at the front of the queue, LOWEST places the task at the back of the queue.
 *  HIGH places the task at the first quartile of the queue, LOW places the task at the third quartile of the queue.
 *  NORMAL places the task at the median of the queue. In general you should schedule tasks with NORMAL priority.
 * @param execute Function to execute when the task is run.
 * @param plugin The plugin that created the task. If null, will be classified as a "system" task.
 * @returns The UUID of the task.
 */
export function addTask(name: string, priority: number | "HIGHEST" | "HIGH" | "NORMAL" | "LOW" | "LOWEST", execute: (...args: any[]) => any, plugin?: Plugin): string | undefined {
  const id = generateUUUID();
  
  let taskPriority = 0;

  if (typeof priority === "number") {
    if (priority > TASK_QUEUE.length) taskPriority = TASK_QUEUE.length;
    if (priority < 0) { console.error("FogFlightControl: Priority must be a positive integer."); return; }
    taskPriority = Math.floor(priority)
  } else {
    switch (priority) {
      case "HIGHEST":
        taskPriority = 0;
        break;
      case "HIGH":
        taskPriority = Math.floor(TASK_QUEUE.length / 4);
        break;
      case "NORMAL":
        taskPriority = Math.floor(TASK_QUEUE.length / 2);
        break;
      case "LOW":
        taskPriority = Math.floor(TASK_QUEUE.length * 3 / 4);
        break;
      case "LOWEST":
        taskPriority = TASK_QUEUE.length;
        break;
    }
  }

  const task: Task = {
    id,
    name,
    priority: taskPriority,
    plugin: plugin !== undefined ? plugin : SYSTEM_PLUGIN,
    status: 'QUEUED',
    execute
  }

  TASK_QUEUE.push(task);
  return id;
}

export function removeTask(taskId: string) {
  // Filter job, insert into task history as cancelled
  const task = TASK_QUEUE.filter(task => task.id === taskId)[0];
  if (task) {
    task.status = 'CANCELLED';
    TASK_HISTORY.push(task);
    TASK_QUEUE = TASK_QUEUE.filter(task => task.id !== taskId);
    return;
  }

  console.warn(`FogFlightControl: Attempted to kill task ${taskId}, but it was not found.`);
}

export function generateUUUID(): string {
  // Generates a UUID according to RFC4122
  // https://stackoverflow.com/a/2117523/1232793
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : r & (0x3 | 0x8)).toString(16);
  });
  return uuid;
}
