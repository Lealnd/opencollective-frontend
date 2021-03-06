import { GraphQLClient } from 'graphql-request';
import { uniqBy } from 'lodash';

import { getGraphqlUrl } from '../../lib/utils';

let client;

function getClient() {
  if (!client) {
    client = new GraphQLClient(getGraphqlUrl(), { headers: {} });
  }
  return client;
}

export async function fetchCollective(collectiveSlug) {
  const query = `
  query Collective($collectiveSlug: String) {
    Collective(slug:$collectiveSlug) {
      id
      slug
      image
      currency
      data
      stats {
        balance
        backers {
          all
        }
        yearlyBudget
      }
    }
  }
  `;

  const result = await getClient().request(query, { collectiveSlug });
  return result.Collective;
}

export async function fetchMembers({ collectiveSlug, tierSlug, backerType, isActive }, options = {}) {
  let query, processResult, type, role;
  if (backerType === 'contributors') {
    query = `
    query Collective($collectiveSlug: String) {
      Collective(slug:$collectiveSlug) {
        id
        data
      }
    }
    `;
    processResult = res => {
      const users = res.Collective.data.githubContributors;
      return Object.keys(users).map(username => {
        const commits = users[username];
        return {
          slug: username,
          type: 'USER',
          image: `https://avatars.githubusercontent.com/${username}?s=96`,
          website: `https://github.com/${username}`,
          stats: { c: commits },
        };
      });
    };
  } else if (backerType) {
    type = backerType.match(/sponsor/i) ? 'ORGANIZATION' : 'USER';
    if (backerType.match(/(backer|sponsor)/)) {
      role = 'BACKER';
    }
    query = `
    query allMembers($collectiveSlug: String!, $type: String!, $role: String!, $isActive: Boolean) {
      allMembers(collectiveSlug: $collectiveSlug, type: $type, role: $role, isActive: $isActive, orderBy: "totalDonations") {
        id
        createdAt
        member {
          id
          type
          slug
          image
          website
          twitterHandle
        }
      }
    }
    `;
    processResult = res => uniqBy(res.allMembers.map(m => m.member), m => m.id);
  } else if (tierSlug) {
    query = `
    query Collective($collectiveSlug: String, $tierSlug: String!, $isActive: Boolean) {
      Collective(slug:$collectiveSlug) {
        tiers(slug: $tierSlug) {
          orders(isActive: $isActive) {
            id
            createdAt
            fromCollective {
              id
              type
              slug
              image
              website
              twitterHandle
            }
          }
        }
      }
    }
    `;
    processResult = res => uniqBy(res.Collective.tiers[0].orders.map(o => o.fromCollective), m => m.id);
  }

  const result = await (options.client || getClient()).request(query, {
    collectiveSlug,
    tierSlug,
    type,
    role,
    isActive,
  });
  const members = processResult(result);
  return members;
}

export async function fetchEvents(parentCollectiveSlug, options = { limit: 10 }) {
  const query = `
  query allEvents($slug: String!, $limit: Int) {
    allEvents(slug:$slug, limit: $limit) {
      id
      name
      description
      slug
      image
      startsAt
      endsAt
      timezone
      location {
        name
        address
        lat
        long
      }
    }
  }
  `;

  const result = await getClient().request(query, {
    slug: parentCollectiveSlug,
    limit: options.limit || 10,
  });
  return result.allEvents;
}

export async function fetchEvent(eventSlug) {
  const query = `
  query Collective($slug: String) {
    Collective(slug:$slug) {
      id
      name
      description
      longDescription
      slug
      image
      startsAt
      endsAt
      timezone
      location {
        name
        address
        lat
        long
      }
      currency
      tiers {
        id
        name
        description
        amount
      }
    }
  }
  `;

  const result = await getClient().request(query, { slug: eventSlug });
  return result.Collective;
}
