import requests
from bs4 import BeautifulSoup
import json
import os
import datetime

# --- 1. 配置区：情报源清单 ---
MONITOR_SOURCES = [
    {"name": "📚 教务处", "url": "http://jwc.swjtu.edu.cn/vatuu/WebAction?setAction=newsList"},
    {"name": "⚡ 电气新闻", "url": "https://dqxy.swjtu.edu.cn/xwdt/qb.htm"},
    {"name": "⚡ 电气公告", "url": "https://dqxy.swjtu.edu.cn/tzgg/qb.htm"}, # 建议把公告也保留，通常公告比新闻更关乎切身利益
    {"name": "📢 学校通知", "url": "https://news.swjtu.edu.cn/zx/tzgg.htm"},
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
            # 兼容老数据：如果之前的 json 里没有 issue_number，就给它加上初始值 5
            if "issue_number" not in reservoir:
                reservoir["issue_number"] = 5
    else:
        # 初始化：默认上次发布是 5 天前，期数从 5 开始
        five_days_ago = (datetime.date.today() - datetime.timedelta(days=5)).strftime("%Y-%m-%d")
        reservoir = {"news": [], "last_post_date": five_days_ago, "issue_number": 5}

    # C. 筛选出真正的新闻
    fresh_news = [t for t in scraped_titles if t not in history]

    # D. 更新蓄水池和历史
    if fresh_news:
        print(f"✨ 发现 {len(fresh_news)} 条新动态，已存入蓄水池。")
        reservoir["news"].extend(fresh_news)
        with open(HISTORY_FILE, "a", encoding="utf-8") as f:
            for t in fresh_news: f.write(t + "\n")


    today = datetime.date.today()
    try:
        last_date = datetime.datetime.strptime(reservoir["last_post_date"], "%Y-%m-%d").date()
    except:
        last_date = today - datetime.timedelta(days=10)  # 容错处理

    days_passed = (today - last_date).days

    should_publish = (len(reservoir["news"]) >= 8) or (days_passed >= 5 and len(reservoir["news"]) > 3)

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
    你是一个负责任的校园新闻摘要助手，任务是为西南交大电气工程专业的大一学生筛选和提炼校园官网新闻。该学生对Python开发、AI大模型、数学建模、嵌入式、电子设计稍微有一点感兴趣。

    请严格遵循以下规则处理今天抓取的新闻标题列表：

    1. **严格过滤**：所有领导开会、视察走访、党建学习、开学检查、节日问候等纯行政宣传类通稿。在结果中略微提及一两句这些新闻即可。
    2. **提取核心**：重点挑选出事关学生切身利益的“教务通知”（如选课、考试、四六级、放假）、“学术竞赛”（重点保留AI、软件、嵌入式、数学建模方向，剩下方向提到即可）以及“学院重要动态”（如奖学金、评优、重大科研突破）。
    3. **语言风格**：使用客观、简练、平实的语言进行总结，像正常的学长在群里发通知一样，不要使用任何夸张、中二或过度拟人化的词汇。

    请严格按照以下 Markdown 格式输出分类（如果没有某类的内容，请直接省略该分类，如果有这些分类没有涉及的新闻 请模仿以下格式自行输出）：

    ### 🚨 紧急与核心预警 (Urgent & Important)
    > 提取带有明确时间节点（Deadline）或必须立刻执行的操作。
    - **[新闻标题]**：明确说明截止时间和需要进行的操作（如：选课抢课、四六级报名/查分、返校填报、补考确认等）。

    ### 📌 教务与培养动态 (Academic Affairs)
    > 事关学业规划的常规通知。
    - **[新闻标题]**：提炼通知重点（如：培养方案调整、公选课名单、放假与校历安排）。

    ### 🚀 竞赛、讲座与科研招募 (Tech & Competitions)
    > 聚焦专业能力拓展。
    - **[新闻标题]**：简要概括核心主题。重点是数学建模、软件开发、AI大模型、嵌入式系统及电气工程前沿方向的比赛或讲座，其余提到即可。

    ### 💰 评优、奖学金与政策 (Honors & Policies)
    > 事关综测与个人履历。
    - **[新闻标题]**：提炼核心评选条件或政策变化（如：奖助学金评定、保研细则、优秀班集体评选）。

    ### 🌐 校园生活与IT服务 (Campus Services)
    > 后勤与基础设施。
    - **[新闻标题]**：提炼影响日常生活的实质信息（如：校园网断网维护、图书馆开放时间调整、食堂/宿舍通知）。
   

    """

    payload = {
        "model": "deepseek-reasoner",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"以下是蓄水池中的最新情报汇总：\n{raw_report}"}
        ]
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}

    print("\n--- 🤖 正在连接 DeepSeek 进行多维度分析 ---")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=120)
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


# --- [新增] PushPlus 微信推送服务 ---
def push_to_wechat(summary_content, blog_url="https://1nuo.me"):
    token = os.getenv("PUSHPLUS_TOKEN")

    if not token:
        print("⚠️ 未检测到 PUSHPLUS_TOKEN，跳过推送。")
        return

    print("📨 正在通过 PushPlus 发送微信情报...")
    url = "http://www.pushplus.plus/send"

    # 构造 Markdown 消息内容
    markdown_text = f"""
### ⚡ 西南交大电气情报局
> 📅 日期：{datetime.datetime.now().strftime('%Y-%m-%d')}
> 🤖 分析员：DeepSeek 

---

{summary_content}

---
[👉 点击查看博客完整排版]({blog_url})
"""

    payload = {
        "token": token,
        "title": f"⚡ 情报局更新提醒 ({datetime.date.today()})",
        "content": markdown_text,
        "template": "markdown"
    }

    try:
        res = requests.post(url, json=payload, timeout=10)
        resp_json = res.json()
        if resp_json['code'] == 200:
            print("✅ PushPlus 推送成功！")
        else:
            print(f"❌ 推送失败: {resp_json['msg']}")
    except Exception as e:
        print(f"❌ 推送网络错误: {e}")


# --- [修改] 5. 执行主流程 ---
# 注意：这里 def 必须顶格写，不能缩进！
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
            # --- 提取当前期数 ---
            current_issue = data.get("issue_number", 5)
            
            # 4. 生成 Hexo 文件
            today_str = datetime.datetime.now().strftime("%Y-%m-%d")
            file_name = f"{POSTS_DIR}{today_str}-ee-intelligence.md"

            # 修正：Front Matter 加入自动计算的期数
            front_matter = f"""---
title: 西南交大电气简报 (Vol.{current_issue}) | {today_str}
date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
tags: [AI, 电气工程, 西南交通大学]
categories: [AI简报]
top_img: /img/categoriesbanner.jpg 
---

> 📡 **情报员注**：本简报由 GitHub Actions 云端自动生成。当前为第 **{current_issue}** 期。

"""
            # 确保目录存在
            if not os.path.exists(POSTS_DIR):
                os.makedirs(POSTS_DIR)

            with open(file_name, "w", encoding="utf-8") as f:
                f.write(front_matter + ai_content)

            print(f"✨ 文章已生成：{file_name} (第 {current_issue} 期)")

            # 调用微信推送
            push_to_wechat(ai_content, blog_url="https://1nuo.me")

            # 5. 清空蓄水池 & 更新时间 & 期数自动 +1
            data["news"] = []
            data["last_post_date"] = today_str
            data["issue_number"] = current_issue + 1  # 核心：为下一期做准备
            
            with open(RESERVOIR_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
        else:
            print("⚠️ AI 未返回内容，暂停发布，保留蓄水池。")
    else:
        # 没触发，只保存蓄水池状态
        with open(RESERVOIR_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"💧 蓄水未满，继续等待... (当前积压: {len(data['news'])} 条)")


if __name__ == "__main__":
    run_satellite()
