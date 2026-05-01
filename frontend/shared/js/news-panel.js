/**
 * Market News Panel Component
 * Pulls live market headlines through the backend proxy.
 */
function newsPanel() {
  const refreshMs = 15 * 60 * 1000;
  const categories = ['all', 'MACRO', 'MARKETS', 'POLICY'];
  const feeds = [
    {
      label: 'WSJ Markets',
      url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml'
    },
    {
      label: 'Google News',
      url: 'https://news.google.com/rss/search?q=markets&hl=en-US&gl=US&ceid=US:en'
    }
  ];
  let cache = null;
  let cacheFeedLabel = 'Live feed';
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
        const rawTitle = textOf(item, 'title');
        const title = source && rawTitle.endsWith(` - ${source}`)
          ? rawTitle.slice(0, -(` - ${source}`).length).trim()
          : rawTitle;
        const category = categorize(title, source);
        const badge = badgeFor(title, category);

        return {
          category,
          badge: badge?.label,
          badgeColor: badge?.color,
          time: formatRelativeTime(new Date(textOf(item, 'pubDate'))),
          title,
          summary: buildSummary(title, source, textOf(item, 'description')),
          source,
          impact: impactLevel(title, category),
          link: textOf(item, 'link')
        };
      })
      .filter(item => item.title);
  }

  function buildFallbackItems() {
    const fallbackItems = [
      {
        title: 'Markets digest latest economic data as investors assess portfolio risk',
        source: 'TGK Demo',
        description: 'A demo market headline is available while the live feed refreshes.',
        minutesAgo: 5
      },
      {
        title: 'Policy outlook remains in focus for wealth management clients',
        source: 'TGK Demo',
        description: 'Advisor teams are monitoring rates, policy signals, and investor sentiment.',
        minutesAgo: 20
      },
      {
        title: 'Portfolio allocation trends point to balanced demand across asset classes',
        source: 'TGK Demo',
        description: 'Equities, fixed income, alternatives, and cash remain central to client conversations.',
        minutesAgo: 45
      }
    ];

    return fallbackItems.map(item => {
      const category = categorize(item.title, item.source);
      const badge = badgeFor(item.title, category);

      return {
        category,
        badge: badge?.label,
        badgeColor: badge?.color,
        time: formatRelativeTime(new Date(Date.now() - item.minutesAgo * 60 * 1000)),
        title: item.title,
        summary: item.description,
        source: item.source,
        impact: impactLevel(item.title, category),
        link: ''
      };
    });
  }

  return {
    open: false,
    search: '',
    activeCategory: 'all',
    categories,
    items: [],
    feedLabel: 'Live feed',
    loaded: false,
    loading: false,
    error: null,

    async init() {
      if (cache && Date.now() - cacheAt < refreshMs) {
        this.items = cache;
        this.feedLabel = cacheFeedLabel;
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

      let lastError = null;

      try {
        for (const feed of feeds) {
          try {
            const xml = await TGK_API.proxyText({
              method: 'GET',
              url: feed.url
            });
            const items = parseFeed(xml);
            if (items.length === 0) {
              throw new Error(`${feed.label} returned no headlines.`);
            }

            this.feedLabel = 'Live feed';
            cacheFeedLabel = this.feedLabel;
            this.items = items;
            cache = items;
            cacheAt = Date.now();
            this.loaded = true;
            return;
          } catch (error) {
            lastError = error;
            console.warn(`Failed to load headlines from ${feed.label}:`, error);
          }
        }

        const items = buildFallbackItems();
        if (items.length > 0) {
          this.feedLabel = 'Demo feed';
          cacheFeedLabel = this.feedLabel;
          this.items = items;
          cache = items;
          cacheAt = Date.now();
          this.loaded = true;
          return;
        } else {
          this.items = [];
          this.error = 'Unable to load live headlines.';
        }
      } catch (error) {
        this.items = [];
        this.error = 'Unable to load live headlines.';
        console.error('Failed to refresh headlines:', error);
      } finally {
        if (lastError && this.loaded && this.feedLabel === 'Demo feed') {
          console.warn('Using demo headlines after live feed failure:', lastError);
        }
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
