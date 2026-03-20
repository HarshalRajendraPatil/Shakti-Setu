const {
  generateAndStoreFeedbackReport,
  ensureFeedbackBackfilledFromConsultations
} = require('../utils/feedbackAnalytics');

let reportSchedulerHandle = null;

const runFeedbackReportCycle = async () => {
  try {
    const backfillResult = await ensureFeedbackBackfilledFromConsultations();
    if (backfillResult.inserted > 0) {
      console.log(`[FeedbackJob] Backfilled ${backfillResult.inserted} consultation ratings into feedback records`);
    }

    const weekly = await generateAndStoreFeedbackReport({
      periodType: 'weekly',
      generationSource: 'system'
    });

    const monthly = await generateAndStoreFeedbackReport({
      periodType: 'monthly',
      generationSource: 'system'
    });

    console.log('[FeedbackJob] Cycle completed', {
      weeklyCreated: weekly.created,
      monthlyCreated: monthly.created,
      weeklyReportId: weekly.report?._id,
      monthlyReportId: monthly.report?._id
    });
  } catch (error) {
    console.error('[FeedbackJob] Error during report cycle:', error);
  }
};

const startFeedbackReportScheduler = () => {
  if (reportSchedulerHandle) return;

  // Run once after startup to ensure analytics data is available.
  setTimeout(runFeedbackReportCycle, 15 * 1000);

  // Re-run every 24 hours (idempotent due to report uniqueness checks).
  reportSchedulerHandle = setInterval(runFeedbackReportCycle, 24 * 60 * 60 * 1000);
  console.log('[FeedbackJob] Scheduler started');
};

module.exports = {
  startFeedbackReportScheduler,
  runFeedbackReportCycle
};
