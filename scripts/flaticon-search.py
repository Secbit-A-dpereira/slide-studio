#!/usr/bin/env python3
"""
Flaticon icon search using CloakBrowser.
Passes Akamai bot protection by running a real browser.

Usage:
  python3 flaticon-search.py "cloud icon"
  -> Returns JSON array of {id, name, cdnUrl, thumbnailUrl}
"""
import sys, json, re, time

def main():
    query = sys.argv[1] if len(sys.argv) > 1 else "icon"

    from cloakbrowser import launch
    browser = launch(humanize=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})

    page.goto(f"https://www.flaticon.com/search?word={query}")
    # Wait for results to load (Akamai challenge may take a moment)
    time.sleep(5)

    # Extract icon links from the page
    links = page.evaluate("""() => {
        const anchors = document.querySelectorAll('a[href*="/free-icon/"]');
        return Array.from(anchors).slice(0, 30).map(a => a.href);
    }""")

    results = []
    seen = set()
    for href in links:
        m = re.search(r'/free-icon/([\w-]+?)_(\d+)', href)
        if m and m.group(2) not in seen:
            seen.add(m.group(2))
            icon_id = m.group(2)
            icon_name = m.group(1).replace('-', ' ')
            prefix = icon_id[:4]
            results.append({
                'id': icon_id,
                'name': icon_name,
                'cdnUrl': f'https://cdn-icons-png.flaticon.com/512/{prefix}/{icon_id}.png',
                'thumbnailUrl': f'https://cdn-icons-png.flaticon.com/128/{prefix}/{icon_id}.png',
            })

    browser.close()
    print(json.dumps(results))

if __name__ == '__main__':
    main()
