"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TaskListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Task } from "@/types/api";

interface TaskListProps {
  ventureId: string;
  compact?: boolean;
  urgentOnly?: boolean;
}

export function TaskList({ ventureId, compact, urgentOnly }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  const fetchTasks = () => {
    const q = urgentOnly ? "?urgentOnly=true" : "";
    fetch(`/api/ventures/${ventureId}/tasks${q}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [ventureId, urgentOnly]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const title = newTitle.trim();
    setNewTitle("");
    setTasks((prev) => [
      {
        id: `opt-${Date.now()}`,
        ventureId,
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task,
      ...prev,
    ]);
    fetch(`/api/ventures/${ventureId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((task) => {
        if (task) setTasks((prev) => prev.map((t) => (t.id.startsWith("opt-") ? task : t)));
        else {
          setTasks((prev) => prev.filter((t) => !t.id.startsWith("opt-")));
          toast.error("Failed to add task");
        }
      })
      .catch(() => {
        setTasks((prev) => prev.filter((t) => !t.id.startsWith("opt-")));
        toast.error("Failed to add task");
      });
  };

  const toggleComplete = (task: Task) => {
    const prev = [...tasks];
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: !x.completed } : x)));
    fetch(`/api/ventures/${ventureId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    })
      .then((r) => r.ok && r.json())
      .then((updated) => {
        if (updated) setTasks((t) => t.map((x) => (x.id === task.id ? updated : x)));
      })
      .catch(() => {
        setTasks(prev);
        toast.error("Failed to update task");
      });
  };

  const deleteTask = (taskId: string) => {
    const prev = [...tasks];
    setTasks((t) => t.filter((x) => x.id !== taskId));
    fetch(`/api/ventures/${ventureId}/tasks/${taskId}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) {
        setTasks(prev);
        toast.error("Failed to delete task");
      }
    });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-medium text-slate-900">Tasks</h3>
        <div className="mt-3">
          <TaskListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-medium text-slate-900">Tasks</h2>
      {!compact && (
        <form onSubmit={handleAdd} className="mt-2 flex gap-2" aria-label="Add task">
          <label htmlFor="task-title-input" className="sr-only">
            New task title
          </label>
          <input
            id="task-title-input"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add task"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="rounded bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Add
          </button>
        </form>
      )}
      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description={urgentOnly ? "No overdue tasks." : "Add a task above to get started."}
          className="mt-3"
        />
      ) : (
        <ul className={compact ? "mt-2 space-y-1" : "mt-3 space-y-2"} role="list">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-start justify-between gap-2 rounded border border-slate-100 p-2 text-sm ${
                t.completed ? "bg-slate-50 text-slate-500" : ""
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => toggleComplete(t)}
                  className="mt-0.5 rounded border-slate-300 focus:ring-slate-500"
                  aria-label={t.completed ? `Mark "${t.title}" incomplete` : `Mark "${t.title}" complete`}
                />
                <span className={t.completed ? "line-through" : ""}>{t.title}</span>
              </label>
              {!compact && (
                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
                  className="text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                  aria-label={`Delete task "${t.title}"`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
