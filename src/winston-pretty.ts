#!/usr/bin/env node

const formatMeta = (meta: Record<string, unknown>) => {
  const metaString = Object.entries(meta).map(([key, value]) => {
    if (value && typeof value === "object") {
      if ("stack" in value) {
        return colors.gray + value.stack + colors.reset;
      }

      return "\n" + JSON.stringify(value, null, 4);
    }
    return " " + value;
  });

  return metaString.join(" ");
};

const colors = {
  red: "\u001b[1;31m",
  green: "\u001b[1;32m",
  yellow: "\u001b[1;93m",
  white: "\u001b[1;37m",
  gray: "\u001b[1;90m",
  reset: "\u001b[0m",
};

const formatLevel = (level: string) => {
  switch (level) {
    case "error":
      return colors.red + level.toUpperCase() + colors.reset;
    case "warn":
      return colors.yellow + level.toUpperCase() + colors.reset;
    case "info":
      return colors.green + level.toUpperCase() + colors.reset;
    case "debug":
      return colors.white + level.toUpperCase() + colors.reset;
    default:
      return level.toUpperCase();
  }
};

const formatTimestamp = (timestamp: string) => {
  return colors.gray + new Date(timestamp).toLocaleTimeString() + colors.reset;
};

const pretty = (data: Buffer) => {
  const logLines = data.toString();

  const returnBuffer = [];

  for (const logLine of logLines.split("\n")) {
    if (logLine === "") {
      continue;
    }

    const logObject = JSON.parse(logLine);

    let { level, message, label, timestamp, ...meta } = logObject;

    label = label ? `[${label.toUpperCase()}]` : "";
    level = formatLevel(level);
    meta = formatMeta(meta);
    timestamp = timestamp ? formatTimestamp(timestamp) : "";

    const prettyString = [timestamp, level, label, message, meta].join(" ");

    returnBuffer.push(Buffer.from(prettyString + "\n"));
  }

  return Buffer.concat(returnBuffer);
};

// Read from stdin, parse the data to human readable log lines and write to stdout
process.stdin.on("data", (data) => {
  try {
    process.stdout.write(pretty(data));
  } catch (error) {
    process.stdout.write(data);
  }
});

// Exit when stdin closes
process.stdin.on("end", () => {
  process.exit(0);
});

// Forward SIGINT to parent process
process.on("SIGINT", () => {
  process.kill(process.ppid, "SIGINT");
});
