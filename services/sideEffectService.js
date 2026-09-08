function sendSubmissionSideEffect(submission) {
  return new Promise((resolve, reject) => {
    // Simulate a failure when testing
    if (process.env.SIDE_EFFECT_MODE === "fail") {
      return reject(new Error("Simulated side effect failure"));
    }

    // Fake email/webhook notification
    console.log("📧 Side effect triggered");
    console.log("Submission ID:", submission.id);
    console.log("Widget ID:", submission.widget_id);

    resolve();
  });
}

module.exports = {
  sendSubmissionSideEffect
};function sendSubmissionSideEffect(submission) {
  return new Promise((resolve, reject) => {
    // Simulate a failure when testing
    if (process.env.SIDE_EFFECT_MODE === "fail") {
      return reject(new Error("Simulated side effect failure"));
    }

    // Fake email/webhook notification
    console.log("📧 Side effect triggered");
    console.log("Submission ID:", submission.id);
    console.log("Widget ID:", submission.widget_id);

    resolve();
  });
}

module.exports = {
  sendSubmissionSideEffect
};