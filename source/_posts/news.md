---
title: 西南交大电气简报-自动化爬虫简报项目记录
date: 2026-02-18 01:34:00
categories:
  - 项目经历
tags:
  - Python
  - GitHub Actions
  - AI
  - 自动化
top_img: https://img.1nuo.me/img/pagebanner1%2026211.webp
---
## Chapter 1: 起因
这其实是 **Gemini** 的主意。
我觉得这个想法很酷。

## Chapter 2: 架构设计
核心逻辑非常简单，就是一条单向的自动化流水线：
1.  **数据源**：西南交大新闻网 & 电气学院官网。
2.  **蓄水池 (Reservoir)**：为了防止频繁骚扰 AI，设计了一个“蓄水池”机制。平时只抓取不发布，等攒够了 7 条新闻，或者过了 5 天，再打包发送。
3.  **大脑**：DeepSeek API 负责把枯燥的通知转化成“人话”和“建议”。
4.  **发布**：生成的 Markdown 文件自动 Push 到仓库，触发 Vercel 构建。

## Chapter 3: 核心代码实现
没有复杂的框架，就是 Python + YAML。

### “蓄水池”决策逻辑 (`spy_v1.3.py`)
这是整个脚本最聪明的地方。它决定了什么时候该“沉默”，什么时候该“说话”。

```python
# --- 核心：蓄水池决策逻辑 ---
def handle_data(scraped_titles):
    # 读取历史记录和蓄水池... (省略文件读取代码)

    # 发现新动态放入蓄水池
    fresh_news = [t for t in scraped_titles if t not in history]
    if fresh_news:
        reservoir["news"].extend(fresh_news)

    # 决策：是否触发 AI 发布？
    # 条件：积压 ≥ 7 条 OR (距离上次发布 ≥ 5 天 AND 有库存 3 条以上)
    should_publish = (len(reservoir["news"]) >= 7) or (days_passed >= 5 and len(reservoir["news"]) > 3)
    
    return should_publish, reservoir
```
### 自动化调度 (`news_spy.yml`)
为了让脚本在 GitHub 的服务器上自动运行，我配置了这个 Workflow。它会在每天北京时间的 08:00 和 20:00 自动醒来干活。

```Yaml
name: EE Intelligence Satellite

on:
  schedule:
    # 每天 UTC 时间 0点和12点 (北京时间 +8)
    - cron: '0 0,12 * * *'
  workflow_dispatch: # 允许手动点击运行

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Run Satellite Logic
      env:
        # Key 存在 GitHub Secrets 里，很安全
        DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
      run: python spy_v3.py
      
    - name: Commit and Push
      # 机器人自动提交代码，更新蓄水池状态
      run: |
        git config --global user.name "GitHub Action Bot"
        git config --global user.email "action@github.com"
        git add .
        git commit -m "chore(spy): update data [skip ci]" || exit 0
        git push
```
## Chapter 4: 总结
很好玩。等开学教务处网站可以访问，把教务处的网址也加进去，重新写一下 prompt 。也想和 QQ BOT 联动，自动推送，真好玩吧。