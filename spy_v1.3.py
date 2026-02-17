import requests
from bs4 import BeautifulSoup
import json
import os
import datetime

# --- 1. 配置区：情报源清单 ---
MONITOR_SOURCES = [
    {"name": "⚡ 电气学院", "url": "https://dqxy.swjtu.edu.cn/tzgg/qb.htm"},
    {"name": "📢 通知公告", "url": "https://news.swjtu.edu.cn/zx/tzgg.htm"},
    {"name": "🏛️ 院部动态", "url": "https://news.swjtu.edu.cn/zx/ybdt.htm"},
    {"name": "📌 交大要闻", "url": "https://news.swjtu.edu.cn/zx/jdyw.htm"},
    {"name": "🔬 学术活动", "url": "https://news.swjtu.edu.cn/zx/xshd.htm"}
]

# 云端相对路径（对应 GitHub 仓库结构）
HISTORY_FILE = "history_titles.txt"
RESERVOIR_FILE = "pending_news.json"
POSTS_DIR = "source/_posts/"


# --- 2. 爬虫函数：抓取真实数据 ---
def fetch_all_titles():
    all_found = []
    # 伪装成浏览器
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

    for source in MONITOR_SOURCES:
        try:
            print(f"📡 正在搜寻【{source['name']}】...")
            # 设置 15秒超时，防止学校服务器卡顿
            res = requests.get(source["url"], headers=headers, timeout=15)
            res.encoding = 'utf-8'
            soup = BeautifulSoup(res.text, "html.parser")

            # 针对不同网站结构的通用提取策略
            for link in soup.find_all('a'):
                t = link.get_text(strip=True)
                # 过滤掉短标题（导航栏、页脚等）
                if len(t) > 12:
                    all_found.append(t)
        except Exception as e:
            print(f"❌ {source['name']} 访问异常: {e}")

    # 去重后返回
    return list(set(all_found))


# --- 3. 核心：蓄水池决策逻辑 ---
def handle_data(scraped_titles):
    # A. 读取历史记录（防止重复抓取）
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = f.read().splitlines()
    else:
        history = []

    # B. 读取蓄水池（查看积压情况）
    if os.path.exists(RESERVOIR_FILE):
        with open(RESERVOIR_FILE, "r", encoding="utf-8") as f:
            reservoir = json.load(f)
    else:
        # 初始化：默认上次发布是 5 天前，确保首次运行能正常判断
        five_days_ago = (datetime.date.today() - datetime.timedelta(days=5)).strftime("%Y-%m-%d")
        reservoir = {"news": [], "last_post_date": five_days_ago}

    # C. 筛选出真正的新闻
    fresh_news = [t for t in scraped_titles if t not in history]

    # D. 更新蓄水池和历史
    if fresh_news:
        print(f"✨ 发现 {len(fresh_news)} 条新动态，已存入蓄水池。")
        reservoir["news"].extend(fresh_news)
        with open(HISTORY_FILE, "a", encoding="utf-8") as f:
            for t in fresh_news: f.write(t + "\n")

    # E. 决策：是否触发 AI 发布？
    # 条件：积压 ≥ 5 条 OR (距离上次发布 ≥ 3 天 AND 有库存)
    today = datetime.date.today()
    try:
        last_date = datetime.datetime.strptime(reservoir["last_post_date"], "%Y-%m-%d").date()
    except:
        last_date = today - datetime.timedelta(days=10)  # 容错处理

    days_passed = (today - last_date).days

    should_publish = (len(reservoir["news"]) >= 5) or (days_passed >= 3 and len(reservoir["news"]) > 0)

    return should_publish, reservoir


# --- 4. AI 大脑：DeepSeek 深度分析 ---
def ask_deepseek_summary(news_list):
    # 【安全关键】从 GitHub 环境变量获取 Key
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("❌ 致命错误：未检测到 DEEPSEEK_API_KEY 环境变量！无法调用 AI。")
        return None

    url = "https://api.deepseek.com/chat/completions"
    raw_report = "\n".join([f"- {t}" for t in news_list])

    # 你的核心 Prompt
    system_prompt = """
    # Role: 西南交大电气工程专业·高级情报分析官 (Digital Sentinel)

    ## Profile
    你不是普通的 AI 总结器，你是专为一名【对嵌入式、AI、数学建模感兴趣的普通电气学生】定制的数字大脑。你简洁、高效、充满理工科的理性。

    ## Mission
    你的任务是对抓取的校园原始情报进行“信号脱水”与“深度解析”，输出一份既能直接指导行动，又能在大局上给出建议的博客稿件。

    ## Logic & Constraints
    1. **电气优先权**：若【电气工程学院】有新动态，必须作为‘头条’，并深度挖掘其背后的保研、奖学金或竞赛潜台词。
    2. **拒绝废话**：不重复无意义的礼仪新闻。
    3. **极客视角**：对于科研动态，要能联想到具体的底层技术（如：提到新能源，要联想到 BMS、PWM 逆变、或者电力电子变换器）。
    4. **行动导向**：每一板块末尾必须有一句给用户的“Action Tip”（行动建议）。

    ## Output Format (Markdown)
    请严格按以下结构输出（>后面的内容请不要输出）：

    ---
    ### ⚡️ 电气频道 | Signal-to-Noise: High
    > 聚焦本院最硬核的动态。
    * **[事件名称]**：简述。
    * * **[深度拆解]**：该动态对保研、综测或技术积累的真实价值。
    * **💡 Action Tip**：[具体怎么做]。

    ### 🌐 跨界哨所 | Cross-domain Insights
    > 扫描全校范围内可能与“电气+AI/建模”产生耦合的机会。
    * **[事件/动态]**：解读其跨学科价值。
    * **💡 Action Tip**：[建议尝试的方向]。

    ### 🛡️ 局长碎碎念 | Mental Firewall
    > 针对当前动态，给用户一句关于“对抗焦虑”或“明确目标”的硬核寄语（用理工科类比）。

    ### 🏫 校园新闻 | Campus News
    > 自由发挥。
    * **💡 Action Tip**：[建议]。
    ---
    """

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"以下是蓄水池中的最新情报汇总：\n{raw_report}"}
        ]
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}

    print("\n--- 🤖 正在连接 DeepSeek 进行多维度分析 ---")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=60)
        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content']
            print("✅ AI 响应成功！")
            return content
        else:
            print(f"❌ AI 调用失败: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ 连接 AI 出错: {e}")
        return None


# --- 5. 执行主流程 ---
def run_satellite():
    # 1. 抓取
    titles = fetch_all_titles()

    # 2. 决策
    trigger, data = handle_data(titles)

    if trigger:
        print(f"🚀 触发发布条件！积压 {len(data['news'])} 条，准备调用 AI...")

        # 3. 调用 AI
        ai_content = ask_deepseek_summary(data['news'])

        if ai_content:
            # 4. 生成 Hexo 文件
            today_str = datetime.datetime.now().strftime("%Y-%m-%d")
            file_name = f"{POSTS_DIR}{today_str}-ee-intelligence.md"

            front_matter = f"""---
title: 西南交大电气简报 | {today_str}
date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
tags: [AI, 电气工程, 西南交通大学]
categories: [AI简报]
top_img: /img/categoriesbanner.jpg 
---

> 📡 **情报员注**：本简报由 GitHub Actions 云端自动生成。

"""
            # 确保目录存在
            if not os.path.exists(POSTS_DIR):
                os.makedirs(POSTS_DIR)

            with open(file_name, "w", encoding="utf-8") as f:
                f.write(front_matter + ai_content)

            print(f"✨ 文章已生成：{file_name}")

            # 5. 清空蓄水池 & 更新时间
            data["news"] = []
            data["last_post_date"] = today_str
            with open(RESERVOIR_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
        else:
            print("⚠️ AI 未返回内容，暂停发布，保留蓄水池。")
    else:
        # 没触发，只保存蓄水池状态（主要是保存新抓到的新闻）
        with open(RESERVOIR_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"💧 蓄水未满，继续等待... (当前积压: {len(data['news'])} 条)")


if __name__ == "__main__":
    run_satellite()