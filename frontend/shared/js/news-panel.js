/**
 * Market News Panel Component
 * Pulls live market headlines through the backend proxy.
 */
function newsPanel() {
  const refreshMs = 15 * 60 * 1000;
  const maxHeadlineAgeMs = 7 * 24 * 60 * 60 * 1000;
  const categories = ['all', 'MACRO', 'MARKETS', 'POLICY'];
  const feeds = [
    {
      label: 'Investing.com Stock Market News',
      url: 'https://www.investing.com/rss/news_25.rss'
    },
    {
      label: 'Google News',
      url: 'https://news.google.com/rss/search?q=markets&hl=en-US&gl=US&ceid=US:en'
    }
  ];
  let cache = null;
  let cacheAt = 0;

  function textOf(node, selector) {
    return node.querySelector(selector)?.textContent?.trim() || '';
  }

  function decodeHtml(html) {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function categorize(title, source) {
    const haystack = `${title} ${source}`.toLowerCase();

    if (/(fed\b|fomc|central bank|rate cut|rate hike|policy|policymaker|regulation|regulator|\brule\b|sec\b|doj|dol\b|white house|congress|treasury secretary|tariff|sanction|trade talks?|opec|government|legislation)/.test(haystack)) return 'POLICY';
    if (/(inflation|economy|economic|consumer|jobs\b|payrolls?|gdp|recession|housing|retail sales|manufacturing|growth|unemployment|confidence|spending|deficit|debt\b|war\b|china|europe)/.test(haystack)) return 'MACRO';
    if (/(bond|treasury|yield|muni|fixed income|stock|dow|s&p|nasdaq|earnings|guidance|results|buyback|dividend|merger|acquisition|deal\b|ipo\b|ceo\b|cfo\b|company|corporate|wall street|market|futures|vix|gold|oil\b|energy|commodity|commodities|crude|natural gas|brent|bitcoin|crypto|dollar|forex|fx\b|currency|yen|euro|shares? (rise|fall|jump|drop|slip|surge))/.test(haystack)) return 'MARKETS';
    return 'MARKETS';
  }

  function impactLevel(title, category) {
    const haystack = `${title} ${category}`.toLowerCase();
    if (/(breaking|live update|surge|plunge|selloff|war|fed|inflation|tariff|oil)/.test(haystack)) return 'high';
    if (/(earnings|stocks|dow|s&p|nasdaq|bond|treasury|gold|market)/.test(haystack)) return 'medium';
    return 'low';
  }

  function badgeFor(title, category) {
    const haystack = title.toLowerCase();
    if (/(breaking|live update)/.test(haystack)) {
      return { label: 'Breaking', color: 'tgk-tone-pill--red' };
    }
    if (/earnings/.test(haystack)) {
      return { label: 'Earnings', color: 'tgk-tone-pill--blue' };
    }
    if (category === 'POLICY') {
      return { label: 'Policy', color: 'tgk-tone-pill--amber' };
    }
    if (/(merger|acquisition|deal\b|ipo\b)/.test(haystack)) {
      return { label: 'Deal', color: 'tgk-tone-pill--violet' };
    }
    if (category === 'MACRO') {
      return { label: 'Macro', color: 'tgk-tone-pill--sky' };
    }
    if (/(alert|warning|surge|plunge|selloff)/.test(haystack)) {
      return { label: 'Alert', color: 'tgk-tone-pill--violet' };
    }
    return null;
  }

  function formatRelativeTime(pubDate) {
    if (!pubDate || Number.isNaN(pubDate.getTime())) return 'Latest';

    const diffMs = Date.now() - pubDate.getTime();
    if (diffMs < 0) return 'Latest';

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  function parsePubDate(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
      return null;
    }

    const normalizedValue = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawValue)
      ? `${rawValue.replace(' ', 'T')}Z`
      : rawValue;
    const pubDate = new Date(normalizedValue);

    return Number.isNaN(pubDate.getTime()) ? null : pubDate;
  }

  function buildSummary(title, source, description) {
    let summary = decodeHtml(description);
    if (source && summary.endsWith(source)) {
      summary = summary.slice(0, -source.length).trim();
    }
    if (summary === title || !summary) {
      return source ? `${source}.` : 'Latest market coverage.';
    }
    return summary.length > 160 ? `${summary.slice(0, 157).trim()}...` : summary;
  }

  function parseFeed(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) {
      return [];
    }

    return Array.from(doc.querySelectorAll('item'))
      .slice(0, 10)
      .map(item => {
        const source = textOf(item, 'source');
        const displaySource = source || textOf(item, 'author');
        const rawTitle = textOf(item, 'title');
        const pubDate = parsePubDate(textOf(item, 'pubDate'));
        const title = source && rawTitle.endsWith(` - ${source}`)
          ? rawTitle.slice(0, -(` - ${source}`).length).trim()
          : rawTitle;
        const category = categorize(title, displaySource);
        const badge = badgeFor(title, category);

        return {
          category,
          badge: badge?.label,
          badgeColor: badge?.color,
          time: formatRelativeTime(pubDate),
          publishedAt: pubDate ? pubDate.getTime() : null,
          title,
          summary: buildSummary(title, displaySource, textOf(item, 'description')),
          source: displaySource,
          impact: impactLevel(title, category),
          link: textOf(item, 'link')
        };
      })
      .filter(item => item.title);
  }

  function isFreshHeadline(item) {
    if (!item.publishedAt) {
      return true;
    }

    return item.publishedAt > Date.now() - maxHeadlineAgeMs;
  }

  return {
    open: false,
    search: '',
    activeCategory: 'all',
    categories,
    items: [],
    loaded: false,
    loading: false,
    error: null,

    async init() {
      if (cache && Date.now() - cacheAt < refreshMs) {
        this.items = cache;
        this.loaded = true;
      }
    },

    async toggleOpen() {
      this.open = !this.open;
      if (!this.open) {
        return;
      }

      if (!this.loaded || Date.now() - cacheAt >= refreshMs) {
        await this.refresh();
      }
    },

    async refresh() {
      this.loading = true;
      this.error = null;

      try {
        for (const feed of feeds) {
          try {
            const xml = await TGK_API.proxyText({
              method: 'GET',
              url: feed.url
            });
            const items = parseFeed(xml);
            const freshItems = items.filter(isFreshHeadline);
            if (freshItems.length === 0) {
              throw new Error(`${feed.label} returned no fresh headlines.`);
            }

            this.items = freshItems;
            cache = freshItems;
            cacheAt = Date.now();
            this.loaded = true;
            return;
          } catch (error) {
            console.warn(`Failed to load headlines from ${feed.label}:`, error);
          }
        }

        this.items = [];
        this.error = 'Unable to load live headlines.';
      } catch (error) {
        this.items = [];
        this.error = 'Unable to load live headlines.';
        console.error('Failed to refresh headlines:', error);
      } finally {
        this.loading = false;
      }
    },

    get filteredItems() {
      return this.items.filter(item => {
        const matchesCategory = this.activeCategory === 'all' || item.category === this.activeCategory;
        const haystack = `${item.title} ${item.summary} ${item.source || ''}`.toLowerCase();
        const matchesSearch = !this.search || haystack.includes(this.search.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    },

    impactColor(level) {
      return {
        high: 'tgk-news-impact-dot--high',
        medium: 'tgk-news-impact-dot--medium',
        low: 'tgk-news-impact-dot--low'
      }[level] || 'tgk-news-impact-dot--neutral';
    }
  };
}
