import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canLoadGoogleAnalytics,
  createGoogleAnalyticsTracker,
  getPageContext,
} from '../src/components/googleAnalytics.mjs';

test('GA loads only for a valid measurement ID on production canonical hosts', () => {
  const allowed = { environment: 'production', hostname: 'itplace.click', measurementId: 'G-ABC123' };
  assert.equal(canLoadGoogleAnalytics(allowed), true);
  assert.equal(canLoadGoogleAnalytics({ ...allowed, hostname: 'www.itplace.click' }), true);
  assert.equal(canLoadGoogleAnalytics({ ...allowed, environment: 'development' }), false);
  assert.equal(canLoadGoogleAnalytics({ ...allowed, hostname: 'localhost' }), false);
  assert.equal(canLoadGoogleAnalytics({ ...allowed, measurementId: 'UA-ABC123' }), false);
  assert.equal(canLoadGoogleAnalytics({ ...allowed, measurementId: '' }), false);
});

test('page context removes query and hash from locations and referrers', () => {
  assert.deepEqual(
    getPageContext({
      origin: 'https://itplace.click',
      pathname: '/benefits',
      referrer: 'https://itplace.click/login?email=user%40example.com#form',
    }),
    { page_location: 'https://itplace.click/benefits', page_referrer: 'https://itplace.click/login' }
  );
  assert.deepEqual(
    getPageContext({
      origin: 'https://itplace.click',
      pathname: '/oauth/callback/kakao',
      referrer: 'https://accounts.example/authorize?code=secret#token',
    }),
    { page_location: 'https://itplace.click/oauth/callback/kakao', page_referrer: 'https://accounts.example' }
  );
  assert.equal(getPageContext({ origin: 'https://itplace.click', pathname: '/', referrer: '' }).page_referrer, '');
});

test('tracker queues config before a single pageview, suppresses callback views, then resumes', () => {
  const calls = [];
  const tracker = createGoogleAnalyticsTracker('G-ABC123', (...args) => calls.push(args));
  const page = (pathname, pageReferrer = '') => ({
    pathname,
    pageContext: getPageContext({ origin: 'https://itplace.click', pathname, referrer: pageReferrer }),
  });

  tracker(page('/oauth/callback/kakao?code=secret'));
  assert.equal(calls.length, 0);
  tracker(page('/benefits?email=user%40example.com#filters'));
  tracker(page('/benefits?different=query#hash'));
  tracker(page('/oauth/callback/kakao?code=secret'));
  tracker(page('/login?memberId=private'));

  assert.deepEqual(calls.map(([command]) => command), ['js', 'config', 'event', 'config', 'config', 'event']);
  assert.equal(calls[2][1], 'page_view');
  assert.equal(calls[2][2].page_location, 'https://itplace.click/benefits');
  assert.equal(calls[3][2].page_location, 'https://itplace.click/oauth/callback/kakao');
  assert.equal(calls[3][2].page_referrer, '');
  assert.equal(calls[4][2].page_location, 'https://itplace.click/login');
  assert.equal(calls[5][2].page_location, 'https://itplace.click/login');
  assert.equal(calls[1][2].send_page_view, false);
  assert.equal(calls[1][2].allow_google_signals, false);
  assert.equal(calls[1][2].allow_ad_personalization_signals, false);
});
