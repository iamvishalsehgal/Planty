// Web notification utilities for watering reminders

let reminderInterval = null;

export async function requestPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function hasPermission() {
  return "Notification" in window && Notification.permission === "granted";
}

export function scheduleReminders(hour, getThirstyCount) {
  stopReminders();
  if (!hasPermission()) return;

  let lastNotifiedDate = null;

  const check = () => {
    const now = new Date();
    const todayKey = now.toDateString();
    // Fire if we've passed the target hour and haven't notified today
    if (now.getHours() >= hour && lastNotifiedDate !== todayKey) {
      const count = getThirstyCount();
      if (count > 0) {
        new Notification("Planty \u{1F331}", {
          body: `${count} plant${count > 1 ? "s" : ""} need${count === 1 ? "s" : ""} water today.`,
          icon: "/Planty/icon.svg",
          tag: "planty-watering",
          requireInteraction: false,
        });
      }
      lastNotifiedDate = todayKey;
    }
  };

  // Check every 60 seconds
  reminderInterval = setInterval(check, 60000);
  check(); // Check immediately on schedule
}

export function stopReminders() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}
