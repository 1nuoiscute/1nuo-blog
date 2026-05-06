#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
西南交大电气情报局 — v1.5
改进：
- 智能过滤：排除党建/领导/行政类新闻
- 降本增效：DeepSeek-V4-Flash 替代 Reasoner
- 内容优化：来源标注 + 诺诺点评栏 + 本周速览
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import datetime

# ======== 配置区 ========

MONITOR_SOURCES = [
    {"name": "📚 教务处", "url": "http://jwc.swjtu.edu.cn/vatuu/WebAction?setAction=newsList"},
    {"name": "⚡ 电气新闻", "url": "https://dqxy.swjtu.edu.cn/xwdt/qb.htm"},
    {"name": "⚡ 电气公告", "url": "https://dqxy.swjtu.edu.cn/tzgg/qb.htm"},
    {"name": "📢 学校通知", "url": "https://news.swjtu.edu.cn/zx/tzgg.htm"},
    {"name": "🔬 学术活动", "url": "https://news.swjtu.edu.cn/zx/xshd.htm"},
]

# 排除词：标题中包含任一关键词的新闻直接丢弃
BLACKLIST_KEYWORDS = [
    "学习贯彻", "隆重召开", "重要讲话", "传达学习",
    "党委", "党建", "党支部", "党总支", "主题教育",
    "调研指导", "考察交流", "走访慰问", "节日问候",
    "开学检查", "毕业致辞", "运动会开幕式",
    "统一战线", "意识形态", "党风廉政建设",
    "理论学习中心组", "民主生活会", "组织生活会",
]

# 文件路径
HISTORY_FILE = "history_titles.txt"
RESERVOIR_FILE = "pending_news.json"
POSTS_DIR = "source/_posts/"

# 阈值：动态调整
BASE_THRESHOLD = 10          # 最少积压条数
MAX_WAIT_DAYS = 5            # 最长等待天数
MIN_NEWS_FOR_EARLY = 5       # 提前发布所需最少条数


# ======== 爬虫函数 ========

def fetch_all_titles():
    """抓取所有监控源的新闻标题"""
    all_found = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for source in MONITOR_SOURCES:
        try:
            print(f"📡 正在搜寻【{source['name']}】...")
            res = requests.get(source["url"], headers=headers, timeout=20)
            res.encoding = 'utf-8'
            soup = BeautifulSoup(res.text, "html.parser")

            for link in soup.find_all('a'):
                t = link.get_text(strip=True)
                if len(t) > 12:
                    all_found.append(t)
        except Exception as e:
            print(f"❌ {source['name']} 访问异常: {e}")

    # 去重 + 过滤行政/党建
    all_found = list(set(all_found))
    filtered = [t for t in all_found if not any(kw in t for kw in BLACKLIST_KEYWORDS)]
    dropped = len(all_found) - len(filtered)
    if dropped:
        print(f"🧹 已过滤 {dropped} 条行政/党建类新闻标题")
    return filtered


# ======== 蓄水池决策 ========

def handle_data(scraped_titles):
    """核心决策逻辑：是否触发发布"""

    # A. 读取历史
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = f.read().splitlines()
    else:
        history = []

    # B. 读取蓄水池
    if os.path.exists(RESERVOIR_FILE):
        with open(RESERVOIR_FILE, "r", encoding="utf-8") as f:
            reservoir = json.load(f)
    else:
        reservoir = {
            "news": [],
            "last_post_date": (datetime.date.today() - datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
            "issue_number": 5,
        }

    if "issue_number" not in reservoir:
        reservoir["issue_number"] = 5

    # C. 去重（过滤已在 fetch 阶段完成）
    fresh_news = [t for t in scraped_titles if t not in history]

    # D. 更新蓄水池
    if fresh_news:
        print(f"✨ 发现 {len(fresh_news)} 条新动态，已存入蓄水池。")
        reservoir["news"].extend(fresh_news)
        with open(HISTORY_FILE, "a", encoding="utf-8") as f:
            for t in fresh_news:
                f.write(t + "\n")

    # E. 决策
    today = datetime.date.today()
    try:
        last_date = datetime.datetime.strptime(
            reservoir["last_post_date"], "%Y-%m-%d"
        ).date()
    except Exception:
        last_date = today - datetime.timedelta(days=10)

    days_passed = (today - last_date).days
    reserve_count = len(reservoir["news"])

    # 阈值：有效内容 8 条即发，比 v1.4 的 12 条降低
    should_publish = (reserve_count >= 8) or \
                     (days_passed >= MAX_WAIT_DAYS and reserve_count >= MIN_NEWS_FOR_EARLY)

    return should_publish, reservoir, days_passed


# ======== AI 摘要（升级版） ========

def ask_deepseek_summary(news_list):
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("❌ 未检测到 DEEPSEEK_API_KEY，无法调用 AI")
        return None

    raw_report = "\n".join([f"- {t}" for t in news_list])

    system_prompt = """你是西南交大电气工程专业大一学生的校园新闻摘要助手。

严格遵循以下规则：

### 1. 严格过滤
所有「领导开会、视察走访、党建学习、开学检查」类新闻，只需要用一句话在末尾汇总即可，不要展开。

### 2. 提取核心
重点挑选：
- 🚨**紧急预警**：选课、考试报名、四六级、补考等有截止时间的事项
- 📌**教务通知**：培养方案、公选课、放假、校历
- 🚀**竞赛与讲座**：数学建模、AI/软件开发、嵌入式/电子设计方向的比赛和讲座优先
- 💰**评优与奖学金**：评定条件、保研细则、综测相关
- 🌐**校园服务**：断网维护、图书馆/食堂/宿舍调整

### 3. 语言风格
像学长在群里发通知一样，客观、简练、平实，不要夸张、不要中二、不要过度拟人化。
每期变换开头句式（避免每次都"据XX报道"）。

### 4. 输出格式
严格按照以下 Markdown 输出（无内容的分直接省略）：

---
### 🚨 紧急与核心预警
> 带明确截止时间的操作（选课、报名、查分、补考等）
- **[标题]**：截止时间和操作步骤

### 📌 教务与培养动态
- **[标题]**：通知要点

### 🚀 竞赛与讲座招募
- **[标题]**：主题和亮点（AI/嵌入式/数模方向优先）

### 💰 评优与奖学金
- **[标题]**：核心评选条件或变化

### 🌐 校园服务角
- **[标题]**：对日常生活的影响

### 📋 本期来源
> 数据抓取自：西南交大教务处 | 电气学院官网 | 校新闻网
---

记住：**不要输出任何超出以上格式的额外信息。**
"""

    payload = {
        "model": "deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"以下是蓄水池中的最新情报汇总：\n{raw_report}"},
        ],
    }

    print(f"\n--- 🤖 调用 DeepSeek-Chat 进行摘要 (共 {len(news_list)} 条) ---")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    try:
        response = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers=headers,
            json=payload,
            timeout=120,
        )
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            print("✅ AI 响应成功！")
            return content
        else:
            print(f"❌ AI 调用失败: {response.status_code} - {response.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ 连接 AI 出错: {e}")
        return None


# ======== PushPlus 推送 ========

def push_to_wechat(summary_content, blog_url="https://1nuo.me"):
    token = os.getenv("PUSHPLUS_TOKEN")
    if not token:
        print("⚠️ 未设置 PUSHPLUS_TOKEN，跳过微信推送")
        return

    print("📨 正在通过 PushPlus 发送微信情报...")
    markdown_text = f"""### ⚡ 西南交大电气情报局
> 📅 {datetime.datetime.now().strftime('%Y-%m-%d')}
> 🤖 DeepSeek-V4-Flash 自动生成

---
{summary_content}
---
[👉 阅读博客完整版]({blog_url})"""

    try:
        res = requests.post(
            "http://www.pushplus.plus/send",
            json={
                "token": token,
                "title": f"⚡ 情报局 Vol.{data.get('issue_number', '?')} ({datetime.date.today()})",
                "content": markdown_text,
                "template": "markdown",
            },
            timeout=10,
        )
        if res.json().get("code") == 200:
            print("✅ PushPlus 推送成功！")
        else:
            print(f"❌ 推送失败: {res.json().get('msg')}")
    except Exception as e:
        print(f"❌ 推送网络错误: {e}")


# ======== 主流程 ========

def run_satellite():
    # 1. 抓取
    titles = fetch_all_titles()

    # 2. 决策
    trigger, data, days_passed = handle_data(titles)

    if trigger:
        reserve_count = len(data["news"])
        print(f"🚀 触发！积压 {reserve_count} 条，距上次发布 {days_passed} 天")
        print("--- 调用 AI 生成摘要 ---")

        ai_content = ask_deepseek_summary(data["news"])

        if ai_content:
            today_str = datetime.datetime.now().strftime("%Y-%m-%d")
            issue = data.get("issue_number", 5)
            file_name = f"{POSTS_DIR}{today_str}-ee-intelligence.md"

            front_matter = f"""---
title: 西南交大电气情报局 (Vol.{issue}) | {today_str}
date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
tags: [AI, 电气工程, 西南交通大学]
categories: [AI简报]
top_img: https://img.1nuo.me/img/categoriesbanner.webp
hide: true
---

> 📡 由 GitHub Actions 自动生成 | 第 **{issue}** 期 | 采样 {reserve_count} 条
>
> 🧩 本期由 DeepSeek-V4-Flash 驱动 🧩

"""

            os.makedirs(POSTS_DIR, exist_ok=True)
            with open(file_name, "w", encoding="utf-8") as f:
                f.write(front_matter + ai_content + "\n")

            print(f"✨ 文章已生成 → {file_name} (Vol.{issue})")

            push_to_wechat(ai_content)

            # 清空蓄水池 + 期数递增
            data["news"] = []
            data["last_post_date"] = today_str
            data["issue_number"] = issue + 1
        else:
            print("⚠️ AI 未返回内容，保留蓄水池，等待下次触-发。")

    else:
        print(f"💧 待命中... (积压 {len(data['news'])} 条, 距今 {days_passed} 天)")

    # 保存状态
    with open(RESERVOIR_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    run_satellite()
