function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function sendSubmissionSideEffect(submission) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (process.env.SIDE_EFFECT_MODE === "fail") {
        throw new Error("Simulated side effect failure");
      }

      console.log("📧 Side effect triggered");
      console.log("Submission ID:", submission.id);
      console.log("Widget ID:", submission.widget_id);
      console.log(`✅ Side effect succeeded on attempt ${attempt}`);

      return;
    } catch (error) {
      console.error(
        `⚠️ Side effect attempt ${attempt} failed:`,
        error.message
      );

      if (attempt < maxAttempts) {
        console.log("🔄 Retrying side effect...");
        await wait(1000);
      }
    }
  }

  console.error(
    "🚨 ALERT: Side effect failed after all retry attempts."
  );
}

module.exports = {
  sendSubmissionSideEffect
};