export const classifyError = (
  logs: string
) => {

  if (
    logs.includes("ECONNREFUSED")
  ) {

    return {
      category: "Network Failure",
      solution: "Retry connection"
    };

  }

  if (
    logs.includes("npm ERR!")
  ) {

    return {
      category: "Dependency Failure",
      solution: "Reinstall packages"
    };

  }

  if (
    logs.includes(
      "Randomised test failed"
    )
  ) {

    return {
      category: "Flaky Test",
      solution: "Retry test"
    };

  }

  return {
    category: "Unknown",
    solution: "Manual investigation"
  };
};