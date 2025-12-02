const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

const keyFile = process.env.GA4_KEY_FILE;
const clientOptions = keyFile ? { keyFilename: path.resolve(keyFile) } : {};
const analyticsDataClient = new BetaAnalyticsDataClient(clientOptions);

const PROPERTY_ID = process.env.BACKEND_PROPERTY_ID; 

const getOverview = async (req, res) => {
  try {
    // Single runReport to fetch metrics
    const [report] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'bounceRate' },
      ],
    });

    // For daily series
    const [series] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const stats = {
      activeUsers: report.rows?.[0]?.metricValues?.[0]?.value || '0',
      newUsers: report.rows?.[0]?.metricValues?.[1]?.value || '0',
      sessions: report.rows?.[0]?.metricValues?.[2]?.value || '0',
      bounceRate: report.rows?.[0]?.metricValues?.[3]?.value || '0',
    };

    const traffic = (series.rows || []).map((r) => ({
      date: r.dimensionValues[0].value,
      users: Number(r.metricValues[0].value),
    }));

    res.json({ stats, traffic });
  } catch (error) {
    console.error('getOverview error', error);
    res.status(500).json({ error: error.message });
  }
};

const getDevices = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers', orderType: 'NUMERIC' }, desc: true }],
    });

    const rows = (response.rows || []).map((r) => ({
      device: r.dimensionValues[0].value,
      users: Number(r.metricValues[0].value),
    }));

    res.json({ rows });
  } catch (error) {
    console.error('getDevices error', error);
    res.status(500).json({ error: error.message });
  }
};

const getTopPages = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    const rows = (response.rows || []).map((r) => ({
      path: r.dimensionValues[0].value,
      views: Number(r.metricValues[0].value),
    }));

    res.json({ rows });
  } catch (error) {
    console.error('getTopPages error', error);
    res.status(500).json({ error: error.message });
  }
};

const getTrafficSources = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });

    const rows = (response.rows || []).map((r) => ({
      source: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
    }));

    res.json({ rows });
  } catch (error) {
    console.error('getTrafficSources error', error);
    res.status(500).json({ error: error.message });
  }
};

const getCountries = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });

    const rows = (response.rows || []).map((r) => ({
      country: r.dimensionValues[0].value,
      users: Number(r.metricValues[0].value),
    }));

    res.json({ rows });
  } catch (error) {
    console.error('getCountries error', error);
    res.status(500).json({ error: error.message });
  }
};

const getRealtime = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: PROPERTY_ID,
      metrics: [{ name: 'activeUsers' }],
    });
    res.json({ activeUsers: response.rows?.[0]?.metricValues?.[0]?.value || '0' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getTopEvents = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10,
    });
    const rows = (response.rows || []).map(r => ({
      event: r.dimensionValues[0].value,
      count: Number(r.metricValues[0].value),
    }));
    res.json({ rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getConversions = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'conversions' }],
    });
    res.json({ conversions: response.rows?.[0]?.metricValues?.[0]?.value || '0' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getEngagementMetrics = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'userEngagementDuration' },
        { name: 'averageSessionDuration' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
      ],
    });

    const row = response.rows?.[0];
    if (!row) {
      return res.json({
        totalEngagementSeconds: '0',
        avgSessionSeconds: '0',
        engagedSessions: '0',
        engagementRate: '0%',
      });
    }

    const metrics = row.metricValues;
    res.json({
      totalEngagementSeconds: metrics[0].value,
      avgSessionSeconds: Number(metrics[1].value).toFixed(1),
      engagedSessions: metrics[2].value,
      engagementRate: (Number(metrics[3].value) * 100).toFixed(1) + '%',
    });
  } catch (error) {
    console.error('getEngagementMetrics error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getChannels = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });
    const rows = (response.rows || []).map(r => ({
      channel: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
    }));
    res.json({ rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getPagePerformance = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'averageSessionDuration' }, desc: true }],
      limit: 5,
    });
    const rows = (response.rows || []).map(r => ({
      path: r.dimensionValues[0].value,
      duration: Number(r.metricValues[0].value).toFixed(1),
    }));
    res.json({ rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getDemographics = async (req, res) => {
  try {
    const [age] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'userAgeBracket' }],
      metrics: [{ name: 'activeUsers' }],
    });
    const [gender] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'userGender' }],
      metrics: [{ name: 'activeUsers' }],
    });

    res.json({
      age: (age.rows || []).map(r => ({ bracket: r.dimensionValues[0].value, users: Number(r.metricValues[0].value) })),
      gender: (gender.rows || []).map(r => ({ gender: r.dimensionValues[0].value, users: Number(r.metricValues[0].value) })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getEngagement = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: PROPERTY_ID,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'engagementRate' }],
    });
    res.json({ rate: (Number(response.rows?.[0]?.metricValues?.[0]?.value) * 100).toFixed(2) + '%' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = {
  getOverview,
  getDevices,
  getTopPages,
  getTrafficSources,
  getCountries,
  getEngagement,
  getDemographics,
  getPagePerformance,
  getChannels,
  getEngagementMetrics,
  getConversions,
  getTopEvents,
  getRealtime,
};