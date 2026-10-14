import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupFavoriteTiersByCarrier,
  isFavoriteTierApplicableToProfile,
} from '../src/features/myPage/utils/favoriteMembership.mjs';

test('all-grade favorite tier applies only to its own carrier', () => {
  const tier = { carrier: 'KT', grade: 'KT_VIP', isAll: true };
  const gradeMatcher = () => false;

  assert.equal(isFavoriteTierApplicableToProfile(tier, 'SKT', 'SKT_GOLD', gradeMatcher), false);
  assert.equal(isFavoriteTierApplicableToProfile(tier, 'KT', 'KT_GOLD', gradeMatcher), true);
});

test('grade matching receives same-carrier LGU VIP콕 profile values', () => {
  const tier = { carrier: 'LGU', grade: 'VIP콕', isAll: false };
  let receivedProfile;

  const applies = isFavoriteTierApplicableToProfile(
    tier,
    'LGU',
    'VVIP',
    (profile) => {
      receivedProfile = profile;
      return profile.benefitGrade === 'VIP콕' && profile.userGrade === 'VVIP';
    }
  );

  assert.equal(applies, true);
  assert.deepEqual(receivedProfile, {
    benefitCarrier: 'LGU',
    benefitGrade: 'VIP콕',
    userCarrier: 'LGU',
    userGrade: 'VVIP',
  });
});

test('favorite conditions stay grouped by their actual carrier', () => {
  const groups = groupFavoriteTiersByCarrier([
    { carrier: 'KT', grade: 'KT_VIP', isAll: true },
    { carrier: 'SKT', grade: 'SKT_GOLD', isAll: false },
    { carrier: null, grade: 'UNKNOWN', isAll: false },
  ]);

  assert.deepEqual(groups.map(({ carrier, tiers }) => [carrier, tiers.length]), [
    ['KT', 1],
    ['SKT', 1],
    [null, 1],
  ]);
});
