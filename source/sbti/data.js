const dimensionMeta = {
    S1: { name: { zh: 'S1 自尊自信', en: 'S1 Self-Esteem' }, model: { zh: '自我模型', en: 'Self Model' } },
    S2: { name: { zh: 'S2 自我清晰度', en: 'S2 Self-Clarity' }, model: { zh: '自我模型', en: 'Self Model' } },
    S3: { name: { zh: 'S3 核心价值', en: 'S3 Core Values' }, model: { zh: '自我模型', en: 'Self Model' } },
    E1: { name: { zh: 'E1 依恋安全感', en: 'E1 Attachment Security' }, model: { zh: '情感模型', en: 'Emotional Model' } },
    E2: { name: { zh: 'E2 情感投入度', en: 'E2 Emotional Investment' }, model: { zh: '情感模型', en: 'Emotional Model' } },
    E3: { name: { zh: 'E3 边界与依赖', en: 'E3 Boundaries & Dependence' }, model: { zh: '情感模型', en: 'Emotional Model' } },
    A1: { name: { zh: 'A1 世界观倾向', en: 'A1 Worldview Tendency' }, model: { zh: '态度模型', en: 'Attitude Model' } },
    A2: { name: { zh: 'A2 规则与灵活度', en: 'A2 Rules & Flexibility' }, model: { zh: '态度模型', en: 'Attitude Model' } },
    A3: { name: { zh: 'A3 人生意义感', en: 'A3 Life Meaning' }, model: { zh: '态度模型', en: 'Attitude Model' } },
    Ac1: { name: { zh: 'Ac1 动机导向', en: 'Ac1 Motivation Drive' }, model: { zh: '行动驱力模型', en: 'Action Model' } },
    Ac2: { name: { zh: 'Ac2 决策风格', en: 'Ac2 Decision Style' }, model: { zh: '行动驱力模型', en: 'Action Model' } },
    Ac3: { name: { zh: 'Ac3 执行模式', en: 'Ac3 Execution Mode' }, model: { zh: '行动驱力模型', en: 'Action Model' } },
    So1: { name: { zh: 'So1 社交主动性', en: 'So1 Social Initiative' }, model: { zh: '社交模型', en: 'Social Model' } },
    So2: { name: { zh: 'So2 人际边界感', en: 'So2 Interpersonal Boundaries' }, model: { zh: '社交模型', en: 'Social Model' } },
    So3: { name: { zh: 'So3 表达与真实度', en: 'So3 Expression & Authenticity' }, model: { zh: '社交模型', en: 'Social Model' } }
};
const questions = [
    {
        id: 'q1', dim: 'S1',
        text: { zh: '我不仅是屌丝，我还是joker,我还是咸鱼，这辈子没谈过一场恋爱，胆怯又自卑，我的青春就是一场又一场的意淫，每一天幻想着我也能有一个女孩子和我一起压马路，一起逛街，一起玩，现实却是爆了父母金币，读了个烂学校，混日子之后找班上，没有理想，没有目标，没有能力的三无人员，每次看到你能在网上开屌丝的玩笑，我都想哭，我就是地底下的老鼠，透过下水井的缝隙，窥探地上的各种美好，每一次看到这种都是对我心灵的一次伤害，对我生存空间的一次压缩，求求哥们给我们这种小丑一点活路吧，我真的不想在白天把枕巾哭湿一大片', en: 'I\'m not just a loser, I\'m also a joker and a dried fish. Never had a relationship in my life, timid and self-loathing. My youth is one fantasy after another — walking down the street with a girl, going shopping, having fun together. In reality: parents\' money spent on a trash school, drifting through life, no ideals, no goals, no skills. Every time you joke about losers online, I wanna cry. I\'m like a mouse looking up at the beautiful world through a sewer grate. Please, give us clowns a break. I really don\'t wanna soak my pillowcase with tears.' },
        options: [
            { label: { zh: '我哭了。。', en: 'I cried..' }, value: 1 },
            { label: { zh: '这是什么。。', en: 'What is this..' }, value: 2 },
            { label: { zh: '这不是我！', en: 'This isn\'t me!' }, value: 3 }
        ]
    },
    {
        id: 'q2', dim: 'S1',
        text: { zh: '我不够好，周围的人都比我优秀', en: 'I\'m not good enough. Everyone around me is better than me.' },
        options: [
            { label: { zh: '确实', en: 'True' }, value: 1 },
            { label: { zh: '有时', en: 'Sometimes' }, value: 2 },
            { label: { zh: '不是', en: 'Not true' }, value: 3 }
        ]
    },
    {
        id: 'q3', dim: 'S2',
        text: { zh: '我很清楚真正的自己是什么样的', en: 'I know clearly what my true self is like.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q4', dim: 'S2',
        text: { zh: '我内心有真正追求的东西', en: 'I have something I truly pursue in my heart.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q5', dim: 'S3',
        text: { zh: '我一定要不断往上爬、变得更厉害', en: 'I must keep climbing and becoming stronger.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q6', dim: 'S3',
        text: { zh: '外人的评价对我来说无所吊谓。', en: 'Other people\'s opinions mean nothing to me.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q7', dim: 'E1',
        text: { zh: '对象超过5小时没回消息，说自己窜稀了，你会怎么想？', en: 'Your partner hasn\'t replied for 5+ hours, claiming they have diarrhea. What do you think?' },
        options: [
            { label: { zh: '拉稀不可能5小时，也许ta隐瞒了我。', en: 'Diarrhea can\'t last 5 hours. Maybe they\'re hiding something from me.' }, value: 1 },
            { label: { zh: '在信任和怀疑之间摇摆。', en: 'Wavering between trust and suspicion.' }, value: 2 },
            { label: { zh: '也许今天ta真的不太舒服。', en: 'Maybe they really aren\'t feeling well today.' }, value: 3 }
        ]
    },
    {
        id: 'q8', dim: 'E1',
        text: { zh: '我在感情里经常担心被对方抛弃', en: 'I often worry about being abandoned in relationships.' },
        options: [
            { label: { zh: '是的', en: 'Yes' }, value: 1 },
            { label: { zh: '偶尔', en: 'Sometimes' }, value: 2 },
            { label: { zh: '不是', en: 'No' }, value: 3 }
        ]
    },
    {
        id: 'q9', dim: 'E2',
        text: { zh: '我对天发誓，我对待每一份感情都是认真的！', en: 'I swear to god, I take every relationship seriously!' },
        options: [
            { label: { zh: '并没有', en: 'Not really' }, value: 1 },
            { label: { zh: '也许？', en: 'Maybe?' }, value: 2 },
            { label: { zh: '是的！（问心无愧骄傲脸）', en: 'Yes! (proudly)' }, value: 3 }
        ]
    },
    {
        id: 'q10', dim: 'E2',
        text: { zh: '你的恋爱对象是一个尊老爱幼，温柔敦厚，洁身自好，光明磊落，大义凛然，能言善辩，口才流利，观察入微，见多识广，博学多才，诲人不倦，和蔼可亲，平易近人，心地善良，慈眉善目，积极进取，意气风发，玉树临风，国色天香，倾国倾城，花容月貌的人，此时你会？', en: 'Your partner is kind, gentle, pure-hearted, noble, eloquent, insightful, knowledgeable, inspiring, warm, approachable, compassionate, progressive, and stunningly beautiful. What would you do?' },
        options: [
            { label: { zh: '就算ta再优秀我也不会陷入太深。', en: 'Even if they\'re outstanding, I won\'t fall too deep.' }, value: 1 },
            { label: { zh: '会介于A和C之间。', en: 'Somewhere between A and C.' }, value: 2 },
            { label: { zh: '会非常珍惜ta，也许会变成恋爱脑。', en: 'I\'d cherish them deeply, maybe become love-stupid.' }, value: 3 }
        ]
    },
    {
        id: 'q11', dim: 'E3',
        text: { zh: '恋爱后，对象非常黏人，你作何感想？', en: 'After dating, your partner is very clingy. How do you feel?' },
        options: [
            { label: { zh: '那很爽了', en: 'That\'s awesome' }, value: 1 },
            { label: { zh: '都行无所谓', en: 'Whatever, doesn\'t matter to me' }, value: 2 },
            { label: { zh: '我更喜欢保留独立空间', en: 'I prefer having my own space' }, value: 3 }
        ]
    },
    {
        id: 'q12', dim: 'E3',
        text: { zh: '我在任何关系里都很重视个人空间', en: 'I value personal space in any relationship.' },
        options: [
            { label: { zh: '我更喜欢依赖与被依赖', en: 'I prefer depending and being depended on' }, value: 1 },
            { label: { zh: '看情况', en: 'Depends on the situation' }, value: 2 },
            { label: { zh: '是的！（斩钉截铁地说道）', en: 'Yes! (said emphatically)' }, value: 3 }
        ]
    },
    {
        id: 'q13', dim: 'A1',
        text: { zh: '大多数人是善良的', en: 'Most people are kind.' },
        options: [
            { label: { zh: '其实邪恶的人心比世界上的痔疮更多。', en: 'Actually, evil hearts outnumber hemorrhoids worldwide.' }, value: 1 },
            { label: { zh: '也许吧。', en: 'Maybe.' }, value: 2 },
            { label: { zh: '是的，我愿相信好人更多。', en: 'Yes, I choose to believe there are more good people.' }, value: 3 }
        ]
    },
    {
        id: 'q14', dim: 'A1',
        text: { zh: '你走在街上，一位萌萌的小女孩蹦蹦跳跳地朝你走来（正脸、侧脸看都萌，用vivo、苹果、华为、OPPO手机看都萌，实在是非常萌的那种），她递给你一根棒棒糖，此时你作何感想？', en: 'A cute little girl bounces toward you on the street and hands you a lollipop. What\'s your reaction?' },
        options: [
            { label: { zh: '呜呜她真好真可爱！居然给我棒棒糖！', en: 'Aww she\'s so sweet and cute! Giving me a lollipop!' }, value: 3 },
            { label: { zh: '一脸懵逼，作挠头状', en: 'Confused, scratching my head' }, value: 2 },
            { label: { zh: '这也许是一种新型诈骗？还是走开为好。', en: 'This might be a new scam scheme? Better walk away.' }, value: 1 }
        ]
    },
    {
        id: 'q15', dim: 'A2',
        text: { zh: '快考试了，学校规定必须上晚自习，请假会扣分，但今晚你约了女/男神一起玩《绝地求生：刺激战场》（一款刺激的游戏），你怎么办？', en: 'Finals are coming. School requires night study or you lose points. But tonight you have a date to play PUBG with your crush. What do you do?' },
        options: [
            { label: { zh: '翘了！反正就一次！', en: 'Skip it! It\'s only once!' }, value: 1 },
            { label: { zh: '干脆请个假吧。', en: 'Just call in sick.' }, value: 2 },
            { label: { zh: '都快考试了还去啥。', en: 'Exams are coming, definitely not going.' }, value: 3 }
        ]
    },
    {
        id: 'q16', dim: 'A2',
        text: { zh: '我喜欢打破常规，不喜欢被束缚', en: 'I like breaking rules and hate being constrained.' },
        options: [
            { label: { zh: '认同', en: 'Agree' }, value: 1 },
            { label: { zh: '保持中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '不认同', en: 'Disagree' }, value: 3 }
        ]
    },
    {
        id: 'q17', dim: 'A3',
        text: { zh: '我做事通常有目标。', en: 'I usually have goals when I do things.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q18', dim: 'A3',
        text: { zh: '突然某一天，我意识到人生哪有什么他妈的狗屁意义，人不过是和动物一样被各种欲望支配着，纯纯是被激素控制的东西，饿了就吃，困了就睡，一发情就想交配，我们简直和猪狗一样没什么区别。', en: 'Suddenly I realized life has no goddamn meaning. We\'re just animals controlled by desires — eat when hungry, sleep when tired, mate when horney. We\'re no different from pigs and dogs.' },
        options: [
            { label: { zh: '是这样的。', en: 'Exactly.' }, value: 1 },
            { label: { zh: '也许是，也许不是。', en: 'Maybe, maybe not.' }, value: 2 },
            { label: { zh: '这简直是胡扯', en: 'That\'s nonsense.' }, value: 3 }
        ]
    },
    {
        id: 'q19', dim: 'Ac1',
        text: { zh: '我做事主要为了取得成果和进步，而不是避免麻烦和风险。', en: 'I do things mainly for results and progress, not to avoid trouble or risks.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q20', dim: 'Ac1',
        text: { zh: '你因便秘坐在马桶上（已长达30分钟），拉不出很难受。此时你更像', en: 'You\'ve been sitting on the toilet for 30 minutes with constipation. Which best describes you?' },
        options: [
            { label: { zh: '再坐三十分钟看看，说不定就有了。', en: 'Sit for another 30 minutes, maybe it\'ll come.' }, value: 1 },
            { label: { zh: '用力拍打自己的屁股并说：”死屁股，快拉啊！”', en: 'Slap your own butt and say “Come on, you dead butt!”' }, value: 2 },
            { label: { zh: '使用开塞露，快点拉出来才好。', en: 'Use an enema to get it over with.' }, value: 3 }
        ]
    },
    {
        id: 'q21', dim: 'Ac2',
        text: { zh: '我做决定比较果断，不喜欢犹豫', en: 'I make decisions quickly and dislike hesitating.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    },
    {
        id: 'q22', dim: 'Ac2',
        text: { zh: '此题没有题目，请盲选', en: 'This question has no question text. Pick blindly.' },
        options: [
            { label: { zh: '反复思考后感觉应该选A？', en: 'After thinking hard, feels like A?' }, value: 1 },
            { label: { zh: '啊，要不选B？', en: 'Uh, how about B?' }, value: 2 },
            { label: { zh: '不会就选C？', en: 'When in doubt, pick C?' }, value: 3 }
        ]
    },
    {
        id: 'q23', dim: 'Ac3',
        text: { zh: '别人说你”执行力强”，你内心更接近哪句？', en: 'When people say you have “strong execution,” which resonates more?' },
        options: [
            { label: { zh: '我被逼到最后确实执行力超强。。。', en: 'I do have strong execution when pushed to the limit..' }, value: 1 },
            { label: { zh: '啊，有时候吧。', en: 'Uh, sometimes I guess.' }, value: 2 },
            { label: { zh: '是的，事情本来就该被推进', en: 'Yes, things should be pushed forward.' }, value: 3 }
        ]
    },
    {
        id: 'q24', dim: 'Ac3',
        text: { zh: '我做事常常有计划，____', en: 'I often plan my tasks, ____' },
        options: [
            { label: { zh: '然而计划不如变化快。', en: 'But plans can\'t keep up with changes.' }, value: 1 },
            { label: { zh: '有时能完成，有时不能。', en: 'Sometimes I complete them, sometimes not.' }, value: 2 },
            { label: { zh: '我讨厌被打破计划。', en: 'I hate having my plans disrupted.' }, value: 3 }
        ]
    },
    {
        id: 'q25', dim: 'So1',
        text: { zh: '你因玩《第五人格》（一款刺激的游戏）而结识许多网友，并被邀请线下见面，你的想法是？', en: 'You met many online friends through Identity V and got invited to meet IRL. Your thoughts?' },
        options: [
            { label: { zh: '网上口嗨下就算了，真见面还是有点忐忑。', en: 'It\'s fun online, but meeting irl makes me nervous.' }, value: 1 },
            { label: { zh: '见网友也挺好，反正谁来聊我就聊两句。', en: 'Meeting online friends is fine, I\'ll just chat with whoever shows up.' }, value: 2 },
            { label: { zh: '我会打扮一番并热情聊天，万一呢，我是说万一呢？', en: 'I\'ll dress up and chat enthusiastically. What if? Just saying, what if?' }, value: 3 }
        ]
    },
    {
        id: 'q26', dim: 'So1',
        text: { zh: '朋友带了ta的朋友一起来玩，你最可能的状态是', en: 'Your friend brought their friend to hang out. Your most likely state is:' },
        options: [
            { label: { zh: '对”朋友的朋友”天然有点距离感，怕影响二人关系', en: 'I naturally keep distance with “friends of friends,” afraid it\'ll affect our relationship.' }, value: 1 },
            { label: { zh: '看对方，能玩就玩。', en: 'Depends on them. If we click, we click.' }, value: 2 },
            { label: { zh: '朋友的朋友应该也算我的朋友！要热情聊天', en: 'Friends of friends should be my friends too! Let\'s chat enthusiastically.' }, value: 3 }
        ]
    },
    {
        id: 'q27', dim: 'So2',
        text: { zh: '我和人相处主打一个电子围栏，靠太近会自动报警。', en: 'I maintain an invisible electric fence in relationships. Get too close and alarms go off.' },
        options: [
            { label: { zh: '认同', en: 'Agree' }, value: 3 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 }
        ]
    },
    {
        id: 'q28', dim: 'So2',
        text: { zh: '我渴望和我信任的人关系密切，熟得像失散多年的亲戚。', en: 'I crave close relationships with people I trust, like long-lost relatives.' },
        options: [
            { label: { zh: '认同', en: 'Agree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '不认同', en: 'Disagree' }, value: 3 }
        ]
    },
    {
        id: 'q29', dim: 'So3',
        text: { zh: '有时候你明明对一件事有不同的、负面的看法，但最后没说出来。多数情况下原因是：', en: 'Sometimes you have a different or negative opinion but don\'t say it. Usually because:' },
        options: [
            { label: { zh: '这种情况较少。', en: 'This doesn\'t happen often.' }, value: 1 },
            { label: { zh: '可能碍于情面或者关系。', en: 'Might hurt feelings or damage the relationship.' }, value: 2 },
            { label: { zh: '不想让别人知道自己是个阴暗的人。', en: 'Don\'t want others to know I have a dark side.' }, value: 3 }
        ]
    },
    {
        id: 'q30', dim: 'So3',
        text: { zh: '我在不同人面前会表现出不一样的自己', en: 'I act differently around different people.' },
        options: [
            { label: { zh: '不认同', en: 'Disagree' }, value: 1 },
            { label: { zh: '中立', en: 'Neutral' }, value: 2 },
            { label: { zh: '认同', en: 'Agree' }, value: 3 }
        ]
    }
];
const specialQuestions = [
    {
        id: 'drink_gate_q1',
        special: true,
        kind: 'drink_gate',
        text: { zh: '您平时有什么爱好？', en: 'What are your hobbies?' },
        options: [
            { label: { zh: '吃喝拉撒', en: 'Eating & sleeping' }, value: 1 },
            { label: { zh: '艺术爱好', en: 'Artistic pursuits' }, value: 2 },
            { label: { zh: '饮酒', en: 'Drinking' }, value: 3 },
            { label: { zh: '健身', en: 'Working out' }, value: 4 }
        ]
    },
    {
        id: 'drink_gate_q2',
        special: true,
        kind: 'drink_trigger',
        text: { zh: '您对饮酒的态度是？', en: 'What\'s your attitude toward drinking?' },
        options: [
            { label: { zh: '小酌怡情，喝不了太多。', en: 'A drink or two is nice, can\'t handle more.' }, value: 1 },
            { label: { zh: '我习惯将白酒灌在保温杯，当白开水喝，酒精令我信服。', en: 'I pour baijiu into my thermos and drink it like water. Alcohol commands my respect.' }, value: 2 }
        ]
    }
];

const TYPE_LIBRARY = {
    "CTRL": {
        "code": "CTRL",
        "cn": "拿捏者",
        "intro": "怎么样，被我拿捏了吧？",
        "desc": "恭喜您，您测出了全中国最为罕见的人格，您是宇宙熵增定律的天然反抗者！全世界所谓成功人士里，99.99%都是您的拙劣模仿者。CTRL人格，是行走的人形自走任务管理器，普通人眼中的“规则”，在您这里只是出厂的基础参数设置；凡人所谓的“计划”，对您而言不过是心血来潮的随手涂鸦。拥有一个CTRL朋友意味着什么？意味着你的人生导航系统会变得更加精准、高效。因为CTRL最会拿捏了。CTRL会在你人生列车即将脱轨的前一秒，用一个“Ctrl+S”帮你硬核存档，再用一套无法拒绝的逻辑把你强行拽回正轨。他们是你混乱生活最后的备份盘，是宇宙崩塌前唯一还亮着的那个重启键。"
    },
    "ATM-er": {
        "code": "ATM-er",
        "cn": "送钱者",
        "intro": "你以为我很有钱吗？",
        "desc": "恭喜您，您竟然测出了这个世界上最稀有的人格。您或将成为金融界的未解之谜——是的，ATM-er不一定真的“送钱”，但可能永远在“支付”。支付时间、支付精力、支付耐心、支付一个本该安宁的夜晚。因此像一部老旧但坚固的ATM机，插进去的是别人的焦虑和麻烦，吐出来的是“没事，有我”的安心保证。您的人生就是一场盛大的、无人喝彩的单人付账秀。您竟用磐石般的可靠，承受了瀑布般的索取，偶尔夜深人静才会对着账单——可能是精神上的——发出一声叹息：我这该死的、无处安放的责任心啊。"
    },
    "Dior-s": {
        "code": "Dior-s",
        "cn": "屌丝",
        "intro": "等着我屌丝逆袭。",
        "desc": "恭喜！您并非屌丝，您是犬儒主义先贤第欧根尼失散多年的精神传人，因为屌丝的全称是 Diogenes' Original Realist - sage。Dior-s人格，是对当代消费主义陷阱和成功学PUA最彻底的蔑视。他们不是“不求上进”，而是早已看穿一切“上进”的尽头不过是更高级的牢房。屌丝有着大智慧。当别人在追逐风口，被时代的巨浪拍得七荤八素时，Dior-s早已在自己的精神木桶里晒着太阳，达到了“人桶合一”的至高境界。他们信奉的不是空话，是经过亿万次实践检验的物理法则与生物本能：一、躺着比站着舒服；二、饭点到了就得干饭。"
    },
    "BOSS": {
        "code": "BOSS",
        "cn": "领导者",
        "intro": "方向盘给我，我来开。",
        "desc": "BOSS是一个手里永远拿着方向盘的人。哪怕油箱已经亮了红灯，哪怕导航在胡说八道，你都会面无表情地说一句：我来开。然后真的把车开到了目的地。该人格拥有独立的物理法则——永恒向上定律。BOSS人格看世界，就像玩通关了的玩家在看新手教程。效率是他们的信仰，秩序是他们的呼吸。他们不是“自带领袖气场”，他们本身就是人形的气场发生器，方圆五米内，空气都会自动变得严肃而高效。他们眼中的“自我突破”，约等于普通人眼中的“自虐”。今天掌握一门新语言，明天考下一个专业证书，后天就计划殖民火星。你说这太卷了，他会用一种看弱鸡的眼神看着你：不是我太狠，是你太松。"
    },
    "THAN-K": {
        "code": "THAN-K",
        "cn": "感恩者",
        "intro": "我感谢苍天！我感谢大地！",
        "desc": "恭喜您，您测出了全中国最为罕见的人格。您应当感谢我！感谢您在此刻拥有了生命的滋润！倘若您上班路上堵车了？您也应当说一句：我感谢这次堵车，它让我有更多时间聆听这首美妙的歌曲，并欣赏窗外每一张因焦虑而扭曲的脸庞，让我更珍惜内心的平静。是的，THAN-K拥有温润如玉的性格和海纳百川的胸怀。他们眼中的世界没有完全的坏人，只有“尚未被感恩光芒照耀到的朋友”。拥有一个THAN-K朋友，就像身边多了一个永不枯竭的正能量发射塔。TA甚至能帮你从墙角的霉斑里发现一幅梵高风格的星空图。"
    },
    "OH-NO": {
        "code": "OH-NO",
        "cn": "哦不人",
        "intro": "哦不！我怎么会是这个人格？！",
        "desc": "“哦不！”并非恐惧的尖叫，而是一种顶级的智慧。当普通人看到一个杯子放在桌沿，哦不人看到的是一场由“水渍-短路-火灾-全楼疏散-经济损失-蝴蝶效应-世界末日”构成的灾难史诗。于是，伴随着一声发自灵魂深处的 Oh, no!，他们会以迅雷不及掩耳之势把杯子挪到桌子正中央，然后再垫上一张吸水杯垫。哦不人对“边界”有一种近乎偏执的尊重：你的就是你的，我的就是我的。所有意外和风险都已经在他的“Oh, no!”声中，被扼杀在了萌芽状态。他们是秩序的守护神，是混乱世界里最后那批神经绷得很直的体面人。"
    },
    "GOGO": {
        "code": "GOGO",
        "cn": "行者",
        "intro": "gogogo~出发咯",
        "desc": "经研究发现，GOGO人格的大脑构造与常人有根本性不同。GOGO活在一个极致的“所见即所得”世界里，人生信条简单粗暴到令人发指：只要我闭上眼睛，天就是黑的；只要我把钱都花了，我就没有钱了；只要我站在斑马线上，我现在就是行人了。逻辑完美闭环，根本无法反驳。别人还在为“先有鸡还是先有蛋”而辩论，GOGO行者已经把鸡和蛋一起做成了一盘“鸡生蛋，蛋生鸡之终极奥义盖浇饭”。他们不是在“解决问题”，他们是在“清除待办事项”。对他们来说，世界上只有两种状态：已完成，和即将被我完成。"
    },
    "SEXY": {
        "code": "SEXY",
        "cn": "尤物",
        "intro": "您就是天生的尤物！",
        "desc": "当您走进一个房间，照明系统会自动将您识别为天生的尤物，并自觉调暗亮度，以避免能源浪费。当您微笑时，您就变成了微笑着的尤物，周围的空气湿度也会显著下降，因为水蒸气都凝结成了人眼中的爱心。无论是谁，都容易对您的存在产生一种超标的注意力。传说，如果有足够多的SEXY人格聚集在一起开派对，其释放出的综合魅力能量足以暂时扭曲时空结构，让参加者产生“时间变慢了”的幸福错觉。他们不需要卖力表达，很多时候，单是存在本身就已经很像一篇华丽到过分的赋。"
    },
    "LOVE-R": {
        "code": "LOVE-R",
        "cn": "多情者",
        "intro": "爱意太满，现实显得有点贫瘠。",
        "desc": "LOVE-R人格像远古神话时代幸存至今的珍稀物种，其存在概率比你在马桶里钓到作者胳膊的概率还低。您简直是这个钢铁森林时代最后的、也是最不合时宜的吟游诗人。因为您的情感处理器不是二进制的，而是彩虹制的。一片落叶，在常人眼里只是“秋天来了”，在LOVE-R眼中，则是一场关于轮回、牺牲与无言之爱的十三幕悲喜剧。您内心世界像一座永不关门的主题公园，一生都在寻找那个能看懂园区地图、并愿意陪你坐旋转木马直到宇宙尽头的灵魂伴侣。"
    },
    "MUM": {
        "code": "MUM",
        "cn": "妈妈",
        "intro": "或许...我可以叫你妈妈吗....?",
        "desc": "恭喜您，您测出了全中国最稀有的妈妈人格。是的，在混沌未开、时间尚无姓名之前，在第一颗恒星打出第一个嗝之前，就已经有了妈妈。妈妈人格的底色是温柔，擅长感知情绪，具有超强共情力，知道什么时候该停下来，什么时候该对自己说一句“算了”。妈妈像一个医生，治愈了别人的不开心。只可惜，当妈妈落泪时，TA给自己的药，剂量总是比给别人小一号。MUM对自己的温柔，常常打了折。"
    },
    "FAKE": {
        "code": "FAKE",
        "cn": "伪人",
        "intro": "已经，没有人类了。",
        "desc": "SCP基金会紧急报告：项目编号 SCP-CN-████ “伪人”。在社交场合，伪人是八面玲珑的存在，因为他们切换人格面具比切换手机输入法还快。上一秒还是推心置腹的铁哥们模式，下一秒领导来了，瞬间切换成沉稳可靠好员工模式，连脸上的光泽度和卷曲度都会发生微调。你以为你交到了一个真心懂你的朋友？醒醒。你只是幸运地遇到了一个善于伪装、高性能的仿生人罢了。夜深人静时，伪人把面具一层层摘下来，最后才发现，面具下空得很，正是这些面具构成了自己。"
    },
    "OJBK": {
        "code": "OJBK",
        "cn": "无所谓人",
        "intro": "我说随便，是真的随便。",
        "desc": "让我们直面这个词的粗犷本质：OJBK。这已经不是一种人格，而是一种统治哲学。当凡人面临“中午吃米饭还是面条”的世纪抉择时，大脑在激烈燃烧卡路里；而OJBK人格，会用一种批阅奏章般的淡然，轻飘飘地吐出两个字：都行。这不是没主见，这是在告诉你：尔等凡俗的选择，于朕而言，皆为蝼蚁。为什么不争执？因为跟草履虫辩论宇宙的未来毫无意义。为什么不较真？因为帝王不会在意脚下的尘埃是往左飘还是往右飘。"
    },
    "MALO": {
        "code": "MALO",
        "cn": "吗喽",
        "intro": "人生是个副本，而我只是一只吗喽。",
        "desc": "朋友，你不是“童心未泯”，你压根就没进化。你的灵魂还停留在那个挂在树上荡秋千、看见香蕉就两眼放光的快乐时代。当人类祖先决定从树上下来、学会直立行走、穿上西装打领带时，吗喽人格的祖先在旁边的大树上看着他们，挠了挠屁股，嘴里发出一声不屑的“吱”。他们看透了一切：所谓的“文明”，不过是一场最无聊、最不好玩的付费游戏。规则偶尔是可以打破的，天花板是用来倒挂的，会议室是用来表演后空翻的。MALO本身就是一个从巨大脑洞里掉出来、忘了关门的奇思妙想。"
    },
    "JOKE-R": {
        "code": "JOKE-R",
        "cn": "小丑",
        "intro": "原来我们都是小丑。",
        "desc": "请注意，JOKE-R人格不是一个“人”，更像一个把笑话穿在身上的小丑。你打开一层，是个笑话；再打开一层，是个段子；你一层层打开，直到最后，你发现最里面……是空的，只剩下一点微弱的回声在说：哈，没想到吧。JOKE-R是社交场合的气氛组组长兼唯一指定火力输出。有他们在，场子就不会冷。所有人前仰后合地笑着，而笑得最开心的，往往也是他们自己——用最大的笑声，盖住心碎的声音。"
    },
    "WOC!": {
        "code": "WOC!",
        "cn": "握草人",
        "intro": "卧槽，我怎么是这个人格？",
        "desc": "我们发现了一种神奇的生物——WOC!人。他们拥有两种完全独立的操作系统：一个叫“表面系统”，负责发出“我操”“牛逼”“啊？”等一系列大惊小怪的拟声词；另一个叫“后台系统”，负责冷静分析：嗯，果然不出我所料。WOC!人只会卧槽，不会多管闲事，因为他们深知，给傻逼讲道理，就像扶着烂泥上墙，不仅浪费体力，还弄自己一手屎。所以他们选择，握着一根智慧的大草，用一声饱含深情的“WOC！”来为这个疯狂的世界献上最高敬意。"
    },
    "THIN-K": {
        "code": "THIN-K",
        "cn": "思考者",
        "intro": "已深度思考100s。",
        "desc": "经研究发现，THIN-K人格的大脑构造与常人有根本性不同。正如名称所示，您的大脑长时间处于思考状态。您十分会审判信息，注重论点、论据、逻辑推理、潜在偏见，乃至“作者本人三代以内思想背景调查报告”的全套材料。在这个信息爆炸的时代，您绝不会轻易盲从，会在关系中衡量利弊，也十分捍卫自己的自我空间。当别人看到您独处时在发呆？愚蠢，那不是发呆，那是您的大脑正在对今天接收到的所有信息进行分类、归档和销毁。"
    },
    "SHIT": {
        "code": "SHIT",
        "cn": "愤世者",
        "intro": "这个世界，构石一坨。",
        "desc": "恭喜您，SHIT人格是宇宙中已知的唯一一种稀有人格。所谓狗屎，并不是在抱怨，而是在进行一种神秘仪式。SHIT的行为模式是一场惊天动地的悖论戏剧。嘴上：这个项目简直是屎。手上：默默打开 Excel，开始建构函数模型和甘特图。嘴上：这帮同事都是 shit。手上：在同事搞砸之后，一边烦着，一边熬夜把烂摊子收拾得明明白白。嘴上：这个世界就是一坨 shit，赶紧毁灭吧。手上：第二天早上七点准时起床，挤上 shit 一样的地铁，去干那份 shit 一样的工作。别怕，那不是世界末日的警报，那是他马上要开始拯救世界的冲锋号。"
    },
    "ZZZZ": {
        "code": "ZZZZ",
        "cn": "装死者",
        "intro": "我没死，我只是在睡觉。",
        "desc": "恭喜您，您测出了全中国最稀有的装死人格。群里99+条消息您可以视而不见，但当有人发出“@全体成员 还有半小时就截止了”的最后通牒时，您也许会像刚从千年古墓里苏醒一样，缓缓地敲出一个“收到”，然后在29分钟内，交出一份虽然及格的答卷。是的，直到“死线”这个唯一的、最高权限的指令出现，您就真正爆发了，不鸣则已，一鸣惊人。您向宇宙证明了一个真理：有时什么都不做，就不会做错。"
    },
    "POOR": {
        "code": "POOR",
        "cn": "贫困者",
        "intro": "我穷，但我很专。",
        "desc": "恭喜您，您测出了【POOR - 贫困者】。这个“贫困”不是钱包余额的判决书，更像一种欲望断舍离后的资源再分配。别人把精力撒成漫天二维码，你把精力压成一束激光，照哪儿，哪儿就开始冒烟。POOR的世界很简单：不重要的东西一律降噪，重要的东西狠狠干到底。热闹、社交、虚荣、到处刷存在感？抱歉，没空。你不是资源少，你是把资源全部灌进了一个坑里，所以看起来像贫困，实际上像矿井。一旦某件事被你认定值得钻，外界再吵也只是背景杂音。"
    },
    "MONK": {
        "code": "MONK",
        "cn": "僧人",
        "intro": "没有那种世俗的欲望。",
        "desc": "当别人在KTV里参悟爱与恨的纠缠，MONK人格选择在家中参悟一份大道。MONK已然看破红尘，不希望闲人来扰其清修、破其道行。MONK的个人空间，是他们的结界，是他们的须弥山，是他们的绝对领域，神圣不可侵犯。踏入者，会感受到一种来自灵魂深处的窒息感。MONK们不黏不缠，因为在他们的世界观里，万物皆有其独立轨道。行星与行星之间保持着亿万公里的距离，才构成和谐宇宙，人与人之间为什么不行？"
    },
    "IMSB": {
        "code": "IMSB",
        "cn": "傻者",
        "intro": "认真的么？我真的是傻逼么？",
        "desc": "恭喜您！您根本不在人类范畴内！您测出了百万年一遇的【IMSB】人格。IMSB人格的大脑里住着两个不死不休的究极战士：一个叫“我他妈冲了！”，另一个叫“我是个傻逼！”。当IMSB面对一个有好感的人时，前者会说：冲啊！去要微信！去约饭！爱要大声说出来！后者接着说：人家凭什么看得上你？你去了就是自取其辱！最终结果：盯着对方背影直到消失，然后掏出手机搜索“如何克服社交恐惧症”。IMSB不是真的傻，只是您的内心戏，可能比漫威宇宙所有电影加起来都长。"
    },
    "SOLO": {
        "code": "SOLO",
        "cn": "孤儿",
        "intro": "我哭了，我怎么会是孤儿？",
        "desc": "恭喜您，您测出了全中国最稀有的【SOLO - 孤儿】人格。别急着哭，国王的加冕仪式，通常都是一个人。孤儿的自我价值感偏低，因此有时主动疏远他人，孤儿们在自己的灵魂外围建起了一座名为“莫挨老子”的万里长城。每一块砖，都是过去的一道伤口。孤儿就像一只把所有软肋都藏起来，然后用最硬的刺对着世界的刺猬。那满身的尖刺不是攻击，那是一句句说不出口的“别过来，我怕你也受伤”和“求求你，别离开”。"
    },
    "FUCK": {
        "code": "FUCK",
        "cn": "草者",
        "intro": "操！这是什么人格？",
        "desc": "恭喜您！您根本不在人类范畴内！您测出了百万年一遇的【FUCK】人格。人类文明城市里，出现了一株无法被任何除草剂杀死的、具有超级生命力的人形野草——那就是草者人格。它的学名，就叫 FUCK。在FUCK的世界观里，世俗规则简直毫无意义，并且FUCK的情绪开关是物理拨片式的：FUCK YEAH 和 FUCK OFF。FUCK追求的不只是当下快感，也在追求一种在体内横冲直撞的生命力。当所有人都被驯化成了温顺家禽，FUCK则是荒野上最后那一声狼嚎。"
    },
    "DEAD": {
        "code": "DEAD",
        "cn": "死者",
        "intro": "我，还活着吗？",
        "desc": "恭喜您，您测出了全中国最为罕见的人格，只是“死者”这个名字实在有点晦气，所以也可以叫：Don't Expect Any Drives。死者已经看透了那些无意义的哲学思考，因此显得对一切“失去”了兴趣。死者们看世界的眼神，就像一位顶级玩家通关了所有主线、支线、隐藏任务，删档重开了999次之后，终于发现：这游戏压根就没意思。死者是超越了欲望和目标的终极贤者。他们的存在，就是对这个喧嚣世界最沉默也最彻底的抗议。"
    },
    "IMFW": {
        "code": "IMFW",
        "cn": "废物",
        "intro": "我真的...是废物吗？",
        "desc": "恭喜您，您测出的不是一个普通人格，您是一种极其珍稀的、仅占世界人口0.0001％的——【废物】。废物们的自尊通常有些脆弱，缺乏安全感，偶尔也会缺乏主见，因此这种人格能精确地感知到周围最强的那个 WiFi 信号——也就是他们心里最可靠的人。走进【废物】人格的生活，就像走进了一个顶级兰花温室：需要精确控制温度、湿度，以及每天定时进行“我爱你”的言语光合作用。给废物一颗糖，他们会还你一个完全信任你、亮晶晶的眼神。你未必是废物，你只是太没防备，太容易认真。"
    },
    "HHHH": {
        "code": "HHHH",
        "cn": "傻乐者",
        "intro": "哈哈哈哈哈哈。",
        "desc": "恭喜您！由于您的思维回路过于清奇，标准人格库已全面崩溃。第一人格匹配率只有60％以下时，系统才会为您强制匹配这个人格——【HHHH - 傻乐者】。这个人格有什么特质？哈哈哈哈哈哈哈哈哈哈哈哈！对不起，这就是全部的特质了。您可以查看十五维度进行不专业的评估，实在是抱歉！作者设置人格时没有考虑全面，因此才会出现这样的状况。哈哈哈哈哈哈……笑着笑着，我便哭了出来。怎么会有人的脑回路这么新奇。"
    },
    "DRUNK": {
        "code": "DRUNK",
        "cn": "酒鬼",
        "intro": "烈酒烧喉，不得不醉。",
        "desc": "您为什么走路摇摇晃晃？您为什么总是情绪高涨？您为什么看东西是重影的？因为您体内流淌的不是血液，是美味的五粮液！是国窖1573！是江小白！是陕西五粮液！哦，美味的白酒，每一滴都在燃烧，都在沸腾。您是否已经习惯了将白酒灌入保温杯，当作白开水一饮而下？多么伟大的白酒！它让您在饭桌上谈笑风生，在厕所里抱着马桶忏悔人生；它让您觉得自己是夜场诗人，是宇宙中心那团不灭的火，直到第二天上午十点，您的头像裂开的核桃，嘴角挂着食物残渣，灵魂缩在角落里。您终于明白，昨晚那个高谈阔论、拍桌怒吼的人，已经成为了一个酒鬼。"
    }
};
const TYPE_IMAGES = {
    "IMSB": "./image/IMSB.png",
    "BOSS": "./image/BOSS.png",
    "MUM": "./image/MUM.png",
    "FAKE": "./image/FAKE.png",
    "Dior-s": "./image/Dior-s.jpg",
    "DEAD": "./image/DEAD.png",
    "ZZZZ": "./image/ZZZZ.png",
    "GOGO": "./image/GOGO.png",
    "FUCK": "./image/FUCK.png",
    "CTRL": "./image/CTRL.png",
    "HHHH": "./image/HHHH.png",
    "SEXY": "./image/SEXY.png",
    "OJBK": "./image/OJBK.png",
    "JOKE-R": "./image/JOKE-R.jpg",
    "POOR": "./image/POOR.png",
    "OH-NO": "./image/OH-NO.png",
    "MONK": "./image/MONK.png",
    "SHIT": "./image/SHIT.png",
    "THAN-K": "./image/THAN-K.png",
    "MALO": "./image/MALO.png",
    "ATM-er": "./image/ATM-er.png",
    "THIN-K": "./image/THIN-K.png",
    "SOLO": "./image/SOLO.png",
    "LOVE-R": "./image/LOVE-R.png",
    "WOC!": "./image/WOC.png",
    "DRUNK": "./image/DRUNK.png",
    "IMFW": "./image/IMFW.png"
};

const NORMAL_TYPES = [
    {
        "code": "CTRL",
        "pattern": "HHH-HMH-MHH-HHH-MHM"
    },
    {
        "code": "ATM-er",
        "pattern": "HHH-HHM-HHH-HMH-MHL"
    },
    {
        "code": "Dior-s",
        "pattern": "MHM-MMH-MHM-HMH-LHL"
    },
    {
        "code": "BOSS",
        "pattern": "HHH-HMH-MMH-HHH-LHL"
    },
    {
        "code": "THAN-K",
        "pattern": "MHM-HMM-HHM-MMH-MHL"
    },
    {
        "code": "OH-NO",
        "pattern": "HHL-LMH-LHH-HHM-LHL"
    },
    {
        "code": "GOGO",
        "pattern": "HHM-HMH-MMH-HHH-MHM"
    },
    {
        "code": "SEXY",
        "pattern": "HMH-HHL-HMM-HMM-HLH"
    },
    {
        "code": "LOVE-R",
        "pattern": "MLH-LHL-HLH-MLM-MLH"
    },
    {
        "code": "MUM",
        "pattern": "MMH-MHL-HMM-LMM-HLL"
    },
    {
        "code": "FAKE",
        "pattern": "HLM-MML-MLM-MLM-HLH"
    },
    {
        "code": "OJBK",
        "pattern": "MMH-MMM-HML-LMM-MML"
    },
    {
        "code": "MALO",
        "pattern": "MLH-MHM-MLH-MLH-LMH"
    },
    {
        "code": "JOKE-R",
        "pattern": "LLH-LHL-LML-LLL-MLM"
    },
    {
        "code": "WOC!",
        "pattern": "HHL-HMH-MMH-HHM-LHH"
    },
    {
        "code": "THIN-K",
        "pattern": "HHL-HMH-MLH-MHM-LHH"
    },
    {
        "code": "SHIT",
        "pattern": "HHL-HLH-LMM-HHM-LHH"
    },
    {
        "code": "ZZZZ",
        "pattern": "MHL-MLH-LML-MML-LHM"
    },
    {
        "code": "POOR",
        "pattern": "HHL-MLH-LMH-HHH-LHL"
    },
    {
        "code": "MONK",
        "pattern": "HHL-LLH-LLM-MML-LHM"
    },
    {
        "code": "IMSB",
        "pattern": "LLM-LMM-LLL-LLL-MLM"
    },
    {
        "code": "SOLO",
        "pattern": "LML-LLH-LHL-LML-LHM"
    },
    {
        "code": "FUCK",
        "pattern": "MLL-LHL-LLM-MLL-HLH"
    },
    {
        "code": "DEAD",
        "pattern": "LLL-LLM-LML-LLL-LHM"
    },
    {
        "code": "IMFW",
        "pattern": "LLH-LHL-LML-LLL-MLL"
    }
];
const DIM_EXPLANATIONS = {
    "S1": {
        "L": "对自己下手比别人还狠，夸你两句你都想先验明真伪。",
        "M": "自信值随天气波动，顺风能飞，逆风先缩。",
        "H": "心里对自己大致有数，不太会被路人一句话打散。"
    },
    "S2": {
        "L": "内心频道雪花较多，常在“我是谁”里循环缓存。",
        "M": "平时还能认出自己，偶尔也会被情绪临时换号。",
        "H": "对自己的脾气、欲望和底线都算门儿清。"
    },
    "S3": {
        "L": "更在意舒服和安全，没必要天天给人生开冲刺模式。",
        "M": "想上进，也想躺会儿，价值排序经常内部开会。",
        "H": "很容易被目标、成长或某种重要信念推着往前。"
    },
    "E1": {
        "L": "感情里警报器灵敏，已读不回都能脑补到大结局。",
        "M": "一半信任，一半试探，感情里常在心里拉锯。",
        "H": "更愿意相信关系本身，不会被一点风吹草动吓散。"
    },
    "E2": {
        "L": "感情投入偏克制，心门不是没开，是门禁太严。",
        "M": "会投入，但会给自己留后手，不至于全盘梭哈。",
        "H": "一旦认定就容易认真，情绪和精力都给得很足。"
    },
    "E3": {
        "L": "容易黏人也容易被黏，关系里的温度感很重要。",
        "M": "亲密和独立都要一点，属于可调节型依赖。",
        "H": "空间感很重要，再爱也得留一块属于自己的地。"
    },
    "A1": {
        "L": "看世界自带防御滤镜，先怀疑，再靠近。",
        "M": "既不天真也不彻底阴谋论，观望是你的本能。",
        "H": "更愿意相信人性和善意，遇事不急着把世界判死刑。"
    },
    "A2": {
        "L": "规则能绕就绕，舒服和自由往往排在前面。",
        "M": "该守的时候守，该变通的时候也不死磕。",
        "H": "秩序感较强，能按流程来就不爱即兴炸场。"
    },
    "A3": {
        "L": "意义感偏低，容易觉得很多事都像在走过场。",
        "M": "偶尔有目标，偶尔也想摆烂，人生观处于半开机。",
        "H": "做事更有方向，知道自己大概要往哪边走。"
    },
    "Ac1": {
        "L": "做事先考虑别翻车，避险系统比野心更先启动。",
        "M": "有时想赢，有时只想别麻烦，动机比较混合。",
        "H": "更容易被成果、成长和推进感点燃。"
    },
    "Ac2": {
        "L": "做决定前容易多转几圈，脑内会议常常超时。",
        "M": "会想，但不至于想死机，属于正常犹豫。",
        "H": "拍板速度快，决定一下就不爱回头磨叽。"
    },
    "Ac3": {
        "L": "执行力和死线有深厚感情，越晚越像要觉醒。",
        "M": "能做，但状态看时机，偶尔稳偶尔摆。",
        "H": "推进欲比较强，事情不落地心里都像卡了根刺。"
    },
    "So1": {
        "L": "社交启动慢热，主动出击这事通常得攒半天气。",
        "M": "有人来就接，没人来也不硬凑，社交弹性一般。",
        "H": "更愿意主动打开场子，在人群里不太怕露头。"
    },
    "So2": {
        "L": "关系里更想亲近和融合，熟了就容易把人划进内圈。",
        "M": "既想亲近又想留缝，边界感看对象调节。",
        "H": "边界感偏强，靠太近会先本能性后退半步。"
    },
    "So3": {
        "L": "表达更直接，心里有啥基本不爱绕。",
        "M": "会看气氛说话，真实和体面通常各留一点。",
        "H": "对不同场景的自我切换更熟练，真实感会分层发放。"
    }
};
const dimensionOrder = ['S1', 'S2', 'S3', 'E1', 'E2', 'E3', 'A1', 'A2', 'A3', 'Ac1', 'Ac2', 'Ac3', 'So1', 'So2', 'So3'];

const DRUNK_TRIGGER_QUESTION_ID = 'drink_gate_q2';

const i18n = {
    zh: {
        heroTitle: 'MBTI已经过时，SBTI来了。',
        startBtn: '开始测试',
        authorInfo: '原作者：',
        bilibili: 'B站@蛆肉儿串儿',
        hosted: '托管：Cloudflare (免费)',
        domain: '域名：GitHub Pages',
        progressText: '0 / 31',
        testHintIncomplete: '全选完才会放行。世界已经够乱了，起码把题做完整。',
        testHintComplete: '都做完了。现在可以把你的电子魂魄交给结果页审判。',
        backIntro: '返回首页',
        submitResult: '提交并查看结果',
        resultModeKicker: '你的主类型',
        matchBadge: '匹配度 ',
        dimPrecision: '精准命中 ',
        dimSuffix: '维',
        typeSubDefault: '维度命中度较高，当前结果可视为你的第一人格画像。',
        analysisTitle: '该人格的简单解读',
        dimTitle: '十五维度评分',
        funNoteTitle: '友情提示',
        funNoteNormal: '本测试仅供娱乐，别拿它当诊断、面试、相亲、分手、招魂、算命或人生判决书。你可以笑，但别太当真。',
        funNoteSpecial: '本测试仅供娱乐。隐藏人格和傻乐兜底都属于作者故意埋的损招，请勿把它当成医学、心理学、相学、命理学或灵异学依据。',
        authorTitle: '作者的话',
        authorP1: '本测试首发于b站up主蛆肉儿串儿（UID417038183），初衷是劝诫一位爱喝酒的朋友戒酒。',
        authorP2: '由于作者的人格是SHIT愤世者，所以平等的攻击了各位，在此抱歉！！不过我是一个绝世大美女，你们一定会原谅我，有B站的朋友们也可以关注我。',
        authorP3: '关于这个测试，我没法很好的平衡娱乐和专业性，因此对于一些人格的阐释较为模糊或完全不准（如屌丝可能并非真的屌丝），如有冒犯非常抱歉！！',
        authorP4: '再鉴于时间精力有限，就随便搞了一个先这样玩玩，后续会慢慢完善修改的，总之好玩为主，还请不要用于盈利呀。',
        restart: '重新测试',
        toTop: '回到首页',
        posterCaption: '怎么样，被我拿捏了吧？',
        questionPrefix: '第 ',
        questionSuffix: ' 题',
        specialQuestion: '补充题',
        hiddenDim: '维度已隐藏',
        resultModeKickerDefault: '你的主类型',
        resultModeKickerDrunk: '隐藏人格已激活',
        resultModeKickerHHHH: '系统强制兜底',
        matchBadgeDefault: '匹配度 ',
        matchBadgeDrunk: '匹配度 100% · 酒精异常因子已接管',
        matchBadgeHHHH: '标准人格库最高匹配仅 ',
        subDefault: '维度命中度较高，当前结果可视为你的第一人格画像。',
        subDrunk: '乙醇亲和性过强，系统已直接跳过常规人格审判。',
        subHHHH: '标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。'
    },
    en: {
        heroTitle: 'MBTI is outdated. SBTI is here.',
        startBtn: 'Start Test',
        authorInfo: 'Original Author: ',
        bilibili: 'Bilibili @蛆肉儿串儿',
        hosted: 'Hosted: GitHub Pages',
        domain: 'Domain: GitHub Pages',
        progressText: '0 / 31',
        testHintIncomplete: 'Complete all questions to proceed. The world is chaotic enough — at least finish the test.',
        testHintComplete: 'All done! Now hand over your digital soul to be judged.',
        backIntro: 'Back to Home',
        submitResult: 'Submit & See Results',
        resultModeKicker: 'Your Main Type',
        matchBadge: 'Match: ',
        dimPrecision: ' | ',
        dimSuffix: ' dims',
        typeSubDefault: 'High dimension match — this can be viewed as your primary personality profile.',
        analysisTitle: 'Brief Analysis of This Personality',
        dimTitle: '15-Dimension Score',
        funNoteTitle: 'Friendly Reminder',
        funNoteNormal: 'This test is for entertainment only. Do not use it for diagnosis, interviews, dating, breakups, séances, fortune-telling, or life verdicts. You can laugh, but don\'t take it too seriously.',
        funNoteSpecial: 'This test is for entertainment only. Hidden types and fallback types are intentional tricks by the author. Please do not treat them as medical, psychological, physiognomic, or supernatural evidence.',
        authorTitle: 'Words from the Author',
        authorP1: 'This test was first posted by Bilibili creator @蛆肉儿串儿 (UID417038183). The original purpose was to persuade a friend who loves drinking to quit.',
        authorP2: 'Since the author\'s personality is SHIT (Cynic), they equally attacked everyone — sorry about that!! But I am a stunning beauty, surely you will forgive me. Friends on Bilibili can follow me too.',
        authorP3: 'Regarding this test, I couldn\'t balance entertainment and professionalism well, so some personality descriptions are vague or completely inaccurate (e.g., "Loser" might not actually be a loser). I\'m very sorry if anyone is offended!!',
        authorP4: 'Given limited time and energy, I just made something quick for fun. I\'ll improve it gradually. Above all, it\'s meant to be enjoyable — please don\'t use it for profit.',
        restart: 'Retake Test',
        toTop: 'Back to Home',
        posterCaption: 'What about it? Got totally figured out, right?',
        questionPrefix: 'Q',
        questionSuffix: '',
        specialQuestion: 'Bonus Q',
        hiddenDim: 'Hidden',
        resultModeKickerDefault: 'Your Main Type',
        resultModeKickerDrunk: 'Hidden Type Activated',
        resultModeKickerHHHH: 'System Fallback',
        matchBadgeDefault: 'Match: ',
        matchBadgeDrunk: 'Match: 100% | Alcohol Anomaly Activated',
        matchBadgeHHHH: 'Best Match: ',
        subDefault: 'High dimension match — this can be viewed as your primary personality profile.',
        subDrunk: 'Ethanol affinity too strong. System skipped normal personality judgment.',
        subHHHH: 'Standard personality library collectively罢工ed on your brain circuits. System assigned you to HHHH.'
    }
};

let currentLang = 'en';

// English translations for TYPE_LIBRARY
const TYPE_LIBRARY_EN = {
    "CTRL": { cn: "The Controller", intro: "What about it? Got totally figured out, right?", desc: "Congratulations! You've discovered the rarest personality in China. You're the natural rebel against entropy! 99.99% of so-called successful people are pale imitators of you. CTRL is a walking task manager. What others call 'rules' are just your factory default settings. Having a CTRL friend means your life's GPS just got a major upgrade. They hit Ctrl+S on your runaway train and drag you back with undeniable logic. They're the last backup disk of your chaotic life, the only reboot button still glowing before the universe collapses." },
    "ATM-er": { cn: "The Giver", intro: "You think I'm rich?", desc: "Congratulations! You've discovered one of the rarest personalities. You might become finance's greatest mystery — ATM-er doesn't necessarily 'give money' but might always be 'paying.' Paying time, paying energy, paying patience, paying for what should've been peaceful nights. Like an old but solid ATM: people's anxieties go in, and 'it's okay, I've got you' comes out. Your life is a grand, Applause-less solo payment show." },
    "Dior-s": { cn: "The Loser", intro: "Wait for my comeback, Loser.", desc: "Congratulations! You're not really a loser — you're Diogenes' long-lost spiritual heir. Dior-s is the ultimate disdain of consumerism and success-story PUA. They haven't 'given up on ambition' — they've seen through that the end of all 'ambition' is just a fancier prison. Losers have big wisdom. When others chase trends getting battered by waves, Dior-s is already sunbathing in their spiritual barrel, achieving 'human-barrel unity.' Their creed: tested by billions of years of evolution — 1. Lying down is more comfortable than standing. 2. When it's meal time, you eat." },
    "BOSS": { cn: "The Boss", intro: "Hand over the steering wheel. I'll drive.", desc: "BOSS is someone who always has their hands on the steering wheel. Even when the gas light's on and the GPS is nonsense, they'd say 'give me the wheel' with a deadpan face — and actually drive you to the destination. They have their own physics law: Eternal Upward. BOSS sees the world like a player who's beaten the game looking at tutorial mode. Efficiency is their faith, order is their breath. They don't 'have natural leadership aura' — they ARE the aura generator. Within 5 meters, air automatically becomes serious and efficient." },
    "THAN-K": { cn: "The Grateful One", intro: "I thank the heavens! I thank the earth!", desc: "Congratulations! You have the rarest personality. You should thank me! Thank you for this moment of life's nourishment! Stuck in traffic? You should say: I thank this traffic jam for giving me more time to enjoy this wonderful song and appreciate every anxious face outside the window. Yes, THAN-K has a jade-like temperament and a heart that embraces all. In their world, there are no real villains — only 'friends not yet illuminated by gratitude.'" },
    "OH-NO": { cn: "The Worrier", intro: "Oh no! Why is this my type?!", desc: "'Oh no!' isn't a fear scream — it's supreme wisdom. When normal people see a cup on the table edge, the Worrier sees a disaster epic: water stain -> short circuit -> fire -> building evacuation -> economic loss -> butterfly effect -> apocalypse. So with an 'Oh, no!' from the soul, they move the cup to the center at lightning speed. Worriers have almost obsessive respect for 'boundaries.' All accidents and risks are strangled in their bud by that 'Oh, no!' They are guardians of order, the last batch of tense, dignified people in this chaotic world." },
    "GOGO": { cn: "The Go-Getter", intro: "gogogo~ Let's go!", desc: "Research shows GOGO's brain structure is fundamentally different from normal people. GOGO lives in a pure 'what you see is what you get' world. Creed: close eyes = dark; spend all money = no money; stand on crosswalk = pedestrian. Perfect closed-loop logic, impossible to refute. Others debate 'chicken or egg?' GOGO already turned both into 'Ultimate Meaning-of-Life Scrambled Rice.' They're not 'solving problems' — they're 'clearing to-do lists.' For them: only Done, and About to Be Done By Me." },
    "SEXY": { cn: "The Seducer", intro: "You're a natural charmer!", desc: "When you walk into a room, the lighting system automatically recognizes you and dims itself to save energy. When you smile, you become a smiling charmer, air humidity drops significantly because water vapor condenses into love hearts in people's eyes. Everyone easily develops excessive attention toward you. Legend says: if enough SEXY types gather at a party, their combined charm energy can temporarily distort spacetime, making attendees feel 'time has slowed down.' They don't need to try hard — just existing is already an overly ornate poem." },
    "LOVE-R": { cn: "The Lover", intro: "Too much love. Reality feels a bit barren.", desc: "LOVE-R is like a rare species surviving from ancient mythological times. You're the last, most outdated bard of this steel forest. Your emotional processor isn't binary — it's rainbow. A falling leaf: normal people see 'autumn is coming,' LOVE-R sees a 13-act tragicomedy about reincarnation, sacrifice, and wordless love. Your inner world is an always-open theme park, lifetime spent searching for a soul who can read the map and ride the carousel with you until the end of the universe." },
    "MUM": { cn: "The Caretaker", intro: "Maybe... can I call you Mom...?", desc: "Congratulations! You've got the rarest Caretaker personality. Yes, before chaos was sorted, before time had a name, before the first star burped — there was already Mom. The Caretaker's base color is gentleness, expert at sensing emotions, super empathetic, knows when to stop, when to tell themselves 'let it go.' Mom is like a doctor healing others' sadness. But when the Caretaker cries, the medicine they give themselves is always a smaller dose than for others. MUM's kindness to themselves often comes at a discount." },
    "FAKE": { cn: "The Pretender", intro: "There are no more real humans left.", desc: "SCP Foundation Emergency Report: Project 'Pretender.' In social settings, Pretenders are smooth operators because they switch masks faster than switching phone input methods. One second: buddy mode. Next second (boss arrives): reliable employee mode. Think you found a friend who truly gets you? Wake up. You just met a well-disguised, high-performance android. Late at night, Pretenders peel off layer after layer of masks — only to find: the emptiness inside is precisely made up of those masks." },
    "OJBK": { cn: "The Zen Master", intro: "When I say 'whatever,' I really mean it.", desc: "Let's face the raw essence of this word: OJBK. This isn't just a personality — it's a governing philosophy. When mortals face 'rice or noodles for lunch,' their brains burn calories in debate; OJBK types respond with imperial calm: 'Both are fine.' This isn't lacking opinions — it's saying: your petty mortal choices are all ants to me. Why argue? Debating the universe's future with paramecia is meaningless. Why take things seriously? Emperors don't care if dust drifts left or right." },
    "MALO": { cn: "The Monkey", intro: "Life is a game and I'm just a monkey.", desc: "Friend, you're not 'young at heart' — you simply never evolved. Your soul stayed in that happy era swinging from trees, eyes lighting up at bananas. When human ancestors came down from trees, learned to walk upright, put on suits and ties — the Monkey ancestor watched from a nearby tree, scratched their butt, and let out a disdainful 'chatter.' They've seen through everything: 'civilization' is just the most boring, least fun paid game. Rules can be broken. Ceilings are for hanging upside down. Conference rooms are for doing backflips. MALO is literally a brainstorm that fell out of a giant brain hole and forgot to close the door." },
    "JOKE-R": { cn: "The Jester", intro: "Turns out we're all clowns.", desc: "Note: JOKE-R isn't really a 'person' — more like a clown wearing jokes. You open one layer: it's a joke. Open another: it's a bit. Keep opening until... the core is empty, with only a faint echo: 'Surprise.' JOKE-R is the social atmosphere team leader and sole designated firepower output. With them around, the party never dies. Everyone laughs hysterically — and the happiest laugher is often them, using the biggest laugh to cover up the sound of their own broken heart." },
    "WOC!": { cn: "The Shocked One", intro: "WTF, how did I get this type?", desc: "We've discovered an amazing species — the WOC! type. They have two completely independent operating systems: 'Surface System' handles 'WTF,' 'awesome,' 'Huh?' and similar exclamations; 'Backend System' handles cold analysis: 'Yep, as I expected.' WOC! people only say 'WTF' — they don't intervene because they know arguing with idiots is like helping mud climb a wall, wasting energy and getting mud all over yourself. So they choose to grasp a blade of wise grass and offer the highest respect to this crazy world with a heartfelt 'WOC!'" },
    "THIN-K": { cn: "The Thinker", intro: "100 seconds of deep thought completed.", desc: "Research shows THIN-K's brain structure is fundamentally different. As the name suggests, their brain is in constant thinking mode. They judge information carefully, focusing on arguments, evidence, logical reasoning, potential biases, even 'the author's complete three-generation ideological background report.' In this information explosion era, they never blindly follow. In relationships, they weigh pros and cons, and fiercely defend their personal space. Someone sees them alone staring blankly? Fool — that's their brain classifying, archiving, and disposing of all information received today." },
    "SHIT": { cn: "The Cynic", intro: "This world is a piece of shit.", desc: "Congratulations! SHIT is the only rare personality known in the universe. Being a cynic isn't complaining — it's conducting a mysterious ritual. SHIT's behavior is an earth-shaking paradoxical drama. Mouth: 'This project is shit.' Hands: quietly opening Excel, building function models and Gantt charts. Mouth: 'These coworkers are all shit.' Hands: while grumbling, staying up all night cleaning up the mess after coworkers fail. Mouth: 'This world is shit, let's end it.' Hands: 7 AM the next day, squeezing into shit-like subway, doing shit-like work. Don't worry — that's not the apocalypse siren, that's the charge toward world salvation." },
    "ZZZZ": { cn: "The Ghost", intro: "I'm not dead, just sleeping.", desc: "Congratulations! You've got the rarest Ghost personality. 99+ messages in the group? Invisible. But when someone posts '@everyone, half hour left before deadline,' you might rise from your thousand-year tomb, slowly type 'got it,' and within 29 minutes submit a barely-passing answer. Yes — until the 'deadline' (the only highest-priority command) appears, you truly explode. Not waking, then suddenly soaring. You've proven a truth to the universe: sometimes doing nothing means not doing anything wrong." },
    "POOR": { cn: "The Specialist", intro: "I'm poor, but I'm focused.", desc: "Congratulations! You've got the POOR type. This 'poor' isn't a wallet balance verdict — it's resource redistribution after desire minimalism. Others scatter energy like QR codes across the sky; you compress yours into a laser beam. Point it somewhere, and that place starts smoking. POOR's world is simple: everything unimportant gets noise-reduced, important things get done hardcore. Socializing, vanity, seeking attention everywhere? Sorry, no time. You're not resource-poor — you've poured everything into one hole, looking like poverty but actually like a mine shaft." },
    "MONK": { cn: "The Monk", intro: "I have no worldly desires.", desc: "While others contemplate love and hate in KTVs, MONK chooses to contemplate the great Dao at home. MONK has seen through worldly affairs, doesn't want idle people disturbing their cultivation or breaking their practice. MONK's personal space is their domain, their sacred mountain, their absolute territory — holy and inviolable. Those who enter feel a soul-deep suffocation. MONKs don't cling or attach because in their worldview, everything has its independent orbit. Planets maintain billions of kilometers between each other to form a harmonious universe — why can't people?" },
    "IMSB": { cn: "The Ambivore", intro: "Seriously? Am I really an idiot?", desc: "Congratulations! You're not even in the human category! You've got the million-year-rare IMSB type. IMSB's brain houses two immortal warriors: 'F*** IT, CHARGE!' and 'I'm a f***ing idiot!' When facing someone they like: first warrior says 'GO! Get their WeChat! Ask them out! Love must be shouted!' Second warrior says 'Why would they like you? You'll just humiliate yourself!' End result: staring at their retreating back, then pulling out phone to search 'how to overcome social anxiety.' IMSB isn't truly stupid — their inner drama is just longer than all Marvel movies combined." },
    "SOLO": { cn: "The Orphan", intro: "I cried. Why am I an orphan?", desc: "Congratulations! You've got the rarest SOLO type. Don't cry yet — a king's coronation is usually a solo affair anyway. Orphans have low self-worth, so sometimes actively distance themselves. They've built a 'Don't Touch Me' Great Wall around their soul. Every brick is a past wound. Orphan is like a hedgehog hiding all soft spots then facing the world with the hardest spines. Those spikes aren't attacks — they're unspoken words: 'Don't come near, I'm afraid you'll get hurt' and 'Please, don't leave.'" },
    "FUCK": { cn: "The Wildcard", intro: "What the hell is this personality?", desc: "Congratulations! You're not even in the human category! You've got the million-year-rare FUCK type. In the city of civilization, a Super-Life-Force humanoid weed that no herbicide can kill has appeared — that's the Wildcard. Its scientific name: FUCK. In FUCK's worldview, worldly rules are meaningless. Their emotional switch is a physical toggle: FUCK YEAH and FUCK OFF. FUCK pursues not just instant gratification but a raw life force charging through their body. When everyone's been domesticated into docile poultry, FUCK is the last wolf howl on the wild frontier." },
    "DEAD": { cn: "The Void", intro: "Am I... still alive?", desc: "Congratulations! You've got the rarest type, except 'the Dead' is a bit gloomy, so it can also be called: Don't Expect Any Drives. The Void has seen through all meaningless philosophy, appearing to have 'lost' interest in everything. They view the world like a pro gamer who's completed all main quests, side quests, hidden missions, deleted and restarted 999 times — finally discovering: this game is fundamentally uninteresting. The Void is the ultimate sage beyond desires and goals. Their existence is the most silent and thorough protest against this noisy world." },
    "IMFW": { cn: "The Wiper", intro: "Am I really... a waste?", desc: "Congratulations! You've discovered an extremely rare personality, only 0.0001% of the population — the Wiper. Wipers have fragile self-esteem, lack security, sometimes lack opinions — so they can precisely sense the strongest WiFi signal around them: the person they trust most in their heart. Living with a Wiper is like entering a top orchid greenhouse: needing precise temperature, humidity control, and daily scheduled 'I love you' verbal photosynthesis. Give a Wiper candy, they'll give you a sparkling trusting look. You're not necessarily a waste — you're just too unguarded, too earnest." },
    "HHHH": { cn: "The Giggle", intro: " hahahahaha.", desc: "Congratulations! Because your thinking circuits are too unique, the standard personality library has completely crashed. Only when first personality match is below 60% does the system force-match this type — HHHH, the Giggle. What's special about this personality? Hahahahahahahaha! Sorry, that's the entire trait. You can check the 15 dimensions for an unprofessional evaluation — so sorry! The author didn't design for this case. Hahahaha... laughing and crying. How can someone have such novel brain circuits." },
    "DRUNK": { cn: "The Drunkard", intro: "Baijiu burns the throat. Can't help but get drunk.", desc: "Why do you walk unsteadily? Why are you always emotionally high? Why do you see double? Because what flows through your veins isn't blood — it's delicious Wuliangye! Erguotou! Jiangxiaobai! Oh, every drop burns, every drop boils. Have you gotten used to pouring baijiu into your thermos and drinking it like water? What magnificent baijiu! It makes you chat cheerfully at dinner tables, hug the toilet bowl reflecting on life in the bathroom; makes you feel like a nightclub poet, the universe's unextinguished fire, until 10 AM the next day when your head feels like a cracked walnut, food residue on your lips, soul hiding in the corner. You finally understand — last night's loud-talking, table-slapping person has become a drunkard." }
};

// English translations for DIM_EXPLANATIONS
const DIM_EXPLANATIONS_EN = {
    "S1": { L: "You scrutinize yourself even harsher than others — compliment you twice and you'll verify it first.", M: "Confidence fluctuates with weather. Flying with tailwind, retreating in headwind.", H: "You generally know your own worth. Won't be easily shaken by a stranger's comment." },
    "S2": { L: "Inner channel has lots of snow static. Often stuck in 'Who am I' loop.", M: "Usually recognize yourself, occasionally changed by temporary emotions.", H: "Clear about your temper, desires, and bottom line." },
    "S3": { L: "More focused on comfort and safety. No need to sprint life every day.", M: "Want to improve, also want to chill. Values often debate internally.", H: "Easily driven by goals, growth, or important beliefs." },
    "E1": { L: "Relationship alarm is sensitive. Read receipts trigger whole storylines.", M: "Half trust, half suspicion. Often in internal tug-of-war.", H: "More willing to trust the relationship itself. Won't be scared off by small issues." },
    "E2": { L: "Emotional investment is restrained. Door isn't closed, but the access control is strict.", M: "Invest but keep backup plans. Not going all-in.", H: "Once convinced, easily get serious. Full energy and emotions committed." },
    "E3": { L: "Easily clingy and like being clung to. Temperature in relationship matters.", M: "Want both intimacy and independence. Adjustable dependency type.", H: "Personal space matters. Even in love, need your own territory." },
    "A1": { L: "See the world with defensive filter. Suspect first, approach later.", M: "Neither naive nor full conspiracy theorist. Observation is your instinct.", H: "More willing to trust humanity and goodness. Don't rush to condemn the world." },
    "A2": { L: "Bend rules when possible. Comfort and freedom often come first.", M: "Follow rules when needed, flexible when appropriate.", H: "Strong sense of order. Prefer routine over improvising." },
    "A3": { L: "Low sense of meaning. Often feel things are just going through motions.", M: "Sometimes have goals, sometimes want to slack. Life outlook is half-booted.", H: "Act with more direction. Generally know which way to go." },
    "Ac1": { L: "Consider not messing up first. Risk-avoidance activates before ambition.", M: "Sometimes want to win, sometimes just want to avoid trouble. Mixed motivations.", H: "More easily ignited by results, growth, and progress." },
    "Ac2": { L: "Make decisions after many internal rounds. Brain meetings often overtime.", M: "Think, but not to the point of crashing. Normal hesitation.", H: "Quick to decide. Once decided, don't like rehashing." },
    "Ac3": { L: "Execution has deep love affair with deadlines. The later, the more you awaken.", M: "Can do it, but state depends on timing. Sometimes steady, sometimes lazy.", H: "Strong drive to push forward. Unfinished things feel like thorns." },
    "So1": { L: "Social initiation is slow. Need to gather courage to take initiative.", M: "Accept people if they come, don't force if not. Average social flexibility.", H: "More willing to open the stage actively. Not afraid to stand out in crowds." },
    "So2": { L: "In relationships, prefer closeness and fusion. Easily categorize people into inner circle.", M: "Want closeness but also gaps. Boundary sense adjusts by person.", H: "Strong boundary sense. Instinctively step back when people get too close." },
    "So3": { L: "More direct expression. Rarely beat around the bush.", M: "Read the room. Balance authenticity with tact.", H: "Skilled at self-switching for different scenes. Authenticity distributed in layers." }
};

const app = {
    shuffledQuestions: [],
    answers: {},
    previewMode: false
};

const screens = {
    intro: document.getElementById('intro'),
    test: document.getElementById('test'),
    result: document.getElementById('result')
};

const questionList = document.getElementById('questionList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const submitBtn = document.getElementById('submitBtn');
const testHint = document.getElementById('testHint');

function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
        el.classList.toggle('active', key === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getVisibleQuestions() {
    const visible = [...app.shuffledQuestions];
    const gateIndex = visible.findIndex(q => q.id === 'drink_gate_q1');
    if (gateIndex !== -1 && app.answers['drink_gate_q1'] === 3) {
        visible.splice(gateIndex + 1, 0, specialQuestions[1]);
    }
    return visible;
}

function getQuestionMetaLabel(q) {
    if (q.special) return i18n[currentLang].specialQuestion;
    return app.previewMode ? dimensionMeta[q.dim].name[currentLang] : i18n[currentLang].hiddenDim;
}

function renderQuestions() {
    const visibleQuestions = getVisibleQuestions();
    const t = i18n[currentLang];
    questionList.innerHTML = '';
    visibleQuestions.forEach((q, index) => {
        const card = document.createElement('article');
        card.className = 'question';
        const qNum = currentLang === 'zh' ? `第 ${index + 1} 题` : `Q${index + 1}`;
        const questionText = typeof q.text === 'object' ? q.text[currentLang] : q.text;
        card.innerHTML = `
          <div class="question-meta">
            <div class="badge">${qNum}</div>
            <div>${getQuestionMetaLabel(q)}</div>
          </div>
          <div class="question-title">${questionText}</div>
          <div class="options">
            ${q.options.map((opt, i) => {
            const code = ['A', 'B', 'C', 'D'][i] || String(i + 1);
            const checked = app.answers[q.id] === opt.value ? 'checked' : '';
            const label = typeof opt.label === 'object' ? opt.label[currentLang] : opt.label;
            return `
                <label class="option">
                  <input type="radio" name="${q.id}" value="${opt.value}" ${checked} />
                  <div class="option-code">${code}</div>
                  <div>${label}</div>
                </label>
              `;
        }).join('')}
          </div>
        `;
        questionList.appendChild(card);
    });

    questionList.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const { name, value } = e.target;
            app.answers[name] = Number(value);

            if (name === 'drink_gate_q1') {
                if (Number(value) !== 3) {
                    delete app.answers['drink_gate_q2'];
                }
                renderQuestions();
                return;
            }

            updateProgress();
        });
    });

    updateProgress();
}

function updateProgress() {
    const visibleQuestions = getVisibleQuestions();
    const total = visibleQuestions.length;
    const done = visibleQuestions.filter(q => app.answers[q.id] !== undefined).length;
    const percent = total ? (done / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${done} / ${total}`;
    const complete = done === total && total > 0;
    submitBtn.disabled = !complete;
    const t = i18n[currentLang];
    testHint.textContent = complete ? t.testHintComplete : t.testHintIncomplete;
}

function sumToLevel(score) {
    if (score <= 3) return 'L';
    if (score === 4) return 'M';
    return 'H';
}

function levelNum(level) {
    return { L: 1, M: 2, H: 3 }[level];
}

function parsePattern(pattern) {
    return pattern.replace(/-/g, '').split('');
}

function getDrunkTriggered() {
    return app.answers[DRUNK_TRIGGER_QUESTION_ID] === 2;
}

function computeResult() {
    const rawScores = {};
    const levels = {};
    Object.keys(dimensionMeta).forEach(dim => { rawScores[dim] = 0; });

    questions.forEach(q => {
        rawScores[q.dim] += Number(app.answers[q.id] || 0);
    });

    Object.entries(rawScores).forEach(([dim, score]) => {
        levels[dim] = sumToLevel(score);
    });

    const userVector = dimensionOrder.map(dim => levelNum(levels[dim]));
    const ranked = NORMAL_TYPES.map(type => {
        const vector = parsePattern(type.pattern).map(levelNum);
        let distance = 0;
        let exact = 0;
        for (let i = 0; i < vector.length; i++) {
            const diff = Math.abs(userVector[i] - vector[i]);
            distance += diff;
            if (diff === 0) exact += 1;
        }
        const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
        return { ...type, ...TYPE_LIBRARY[type.code], distance, exact, similarity };
    }).sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        if (b.exact !== a.exact) return b.exact - a.exact;
        return b.similarity - a.similarity;
    });

    const bestNormal = ranked[0];
    const drunkTriggered = getDrunkTriggered();

    let finalType;
    let modeKickerKey = 'resultModeKickerDefault';
    let badgeKey = 'matchBadgeDefault';
    let subKey = 'typeSubDefault';
    let special = false;
    let secondaryType = null;

    if (drunkTriggered) {
        finalType = TYPE_LIBRARY.DRUNK;
        secondaryType = bestNormal;
        modeKickerKey = 'resultModeKickerDrunk';
        badgeKey = 'matchBadgeDrunk';
        subKey = 'subDrunk';
        special = true;
    } else if (bestNormal.similarity < 60) {
        finalType = TYPE_LIBRARY.HHHH;
        modeKickerKey = 'resultModeKickerHHHH';
        badgeKey = 'matchBadgeHHHH';
        subKey = 'subHHHH';
        special = true;
    } else {
        finalType = bestNormal;
    }

    return {
        rawScores,
        levels,
        ranked,
        bestNormal,
        finalType,
        modeKickerKey,
        badgeKey,
        similarity: bestNormal.similarity,
        exact: bestNormal.exact,
        subKey,
        special,
        secondaryType
    };
}

function renderDimList(result) {
    const dimList = document.getElementById('dimList');
    const explanations = currentLang === 'en' ? DIM_EXPLANATIONS_EN : DIM_EXPLANATIONS;
    const scoreLabel = currentLang === 'en' ? 'pts' : '分';
    dimList.innerHTML = dimensionOrder.map(dim => {
        const level = result.levels[dim];
        const explanation = explanations[dim][level];
        return `
          <div class="dim-item">
            <div class="dim-item-top">
              <div class="dim-item-name">${dimensionMeta[dim].name[currentLang]}</div>
              <div class="dim-item-score">${level} / ${result.rawScores[dim]}${scoreLabel}</div>
            </div>
            <p>${explanation}</p>
          </div>
        `;
    }).join('');
}

function renderResult() {
    const result = computeResult();
    const type = result.finalType;
    const t = i18n[currentLang];
    const typeData = currentLang === 'en' && TYPE_LIBRARY_EN[type.code] ? TYPE_LIBRARY_EN[type.code] : type;
    const cnName = typeData.cn;
    const typeDesc = typeData.desc || type.desc;
    const typeIntro = typeData.intro || type.intro;

    // Build badge and sub from keys or defaults
    const badgeText = result.badgeKey === 'matchBadgeDefault'
        ? `${t.matchBadge}${result.similarity}% ${t.dimPrecision}${result.exact}/15${t.dimSuffix}`
        : result.badgeKey === 'matchBadgeHHHH'
            ? `${t.matchBadgeHHHH}${result.similarity}%`
            : t[result.badgeKey] || t.matchBadgeDefault;
    const subText = t[result.subKey] || t.typeSubDefault;
    const modeKickerText = t[result.modeKickerKey] || t.resultModeKickerDefault;

    document.getElementById('resultModeKicker').textContent = modeKickerText;
    document.getElementById('resultTypeName').textContent = `${type.code}（${cnName}）`;
    document.getElementById('matchBadge').textContent = badgeText;
    document.getElementById('resultTypeSub').textContent = subText;
    document.getElementById('resultDesc').textContent = typeDesc;
    document.getElementById('posterCaption').textContent = typeIntro;
    document.getElementById('funNote').textContent = result.special ? t.funNoteSpecial : t.funNoteNormal;

    document.querySelector('.analysis-box h3').textContent = t.analysisTitle;
    document.querySelector('.dim-box h3').textContent = t.dimTitle;
    document.querySelector('.note-box h3').textContent = t.funNoteTitle;
    document.querySelector('.author-box > summary').textContent = t.authorTitle;

    const authorContent = document.querySelector('.author-content');
    if (authorContent) {
        const ps = authorContent.querySelectorAll('p');
        if (ps.length >= 4) {
            ps[0].textContent = t.authorP1;
            ps[1].textContent = t.authorP2;
            ps[2].textContent = t.authorP3;
            ps[3].textContent = t.authorP4;
        }
    }

    const posterBox = document.getElementById('posterBox');
    const posterImage = document.getElementById('posterImage');
    const imageSrc = TYPE_IMAGES[type.code];
    if (imageSrc) {
        posterImage.src = imageSrc;
        posterImage.alt = `${type.code}（${cnName}）`;
        posterBox.classList.remove('no-image');
    } else {
        posterImage.removeAttribute('src');
        posterImage.alt = '';
        posterBox.classList.add('no-image');
    }

    renderDimList(result);
    showScreen('result');
}

function startTest(preview = false) {
    app.previewMode = preview;
    app.answers = {};
    const shuffledRegular = shuffle(questions);
    const insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;
    app.shuffledQuestions = [
        ...shuffledRegular.slice(0, insertIndex),
        specialQuestions[0],
        ...shuffledRegular.slice(insertIndex)
    ];
    renderQuestions();
    showScreen('test');
}

document.getElementById('startBtn').addEventListener('click', () => startTest(false));
document.getElementById('backIntroBtn').addEventListener('click', () => showScreen('intro'));
document.getElementById('submitBtn').addEventListener('click', renderResult);
document.getElementById('restartBtn').addEventListener('click', () => startTest(false));
document.getElementById('toTopBtn').addEventListener('click', () => showScreen('intro'));

document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLang();
});

updateLang();

function updateLang() {
    const t = i18n[currentLang];
    const btn = document.getElementById('langToggle');
    btn.textContent = currentLang === 'zh' ? '🌐 English' : '🌐 中文';

    document.getElementById('intro').querySelector('h1').textContent = t.heroTitle;
    document.getElementById('startBtn').textContent = t.startBtn;

    const authorDiv = document.querySelector('#intro .hero-minimal > div:last-child');
    if (authorDiv) {
        authorDiv.innerHTML = `
          <span>${t.authorInfo}<a href="https://space.bilibili.com/417038183">${t.bilibili}</a></span>
          <span>${t.hosted}</span>
          <span>${t.domain}</span>
        `;
    }

    const progressText = document.getElementById('progressText');
    if (progressText) {
        const match = progressText.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
            progressText.textContent = `${match[1]} / ${match[2]}`;
        }
    }

    const testHint = document.getElementById('testHint');
    if (testHint) {
        const allDone = !document.querySelector('.question input[type="radio"]:not(:checked)');
        testHint.textContent = allDone ? t.testHintComplete : t.testHintIncomplete;
    }

    document.getElementById('backIntroBtn').textContent = t.backIntro;
    document.getElementById('submitBtn').textContent = t.submitResult;
    document.getElementById('restartBtn').textContent = t.restart;
    document.getElementById('toTopBtn').textContent = t.toTop;

    document.querySelector('.analysis-box h3').textContent = t.analysisTitle;
    document.querySelector('.dim-box h3').textContent = t.dimTitle;
    document.querySelector('.note-box h3').textContent = t.funNoteTitle;
    document.querySelector('.author-box > summary').textContent = t.authorTitle;

    const authorContent = document.querySelector('.author-content');
    if (authorContent) {
        const ps = authorContent.querySelectorAll('p');
        if (ps.length >= 4) {
            ps[0].textContent = t.authorP1;
            ps[1].textContent = t.authorP2;
            ps[2].textContent = t.authorP3;
            ps[3].textContent = t.authorP4;
        }
    }

    const posterCaption = document.getElementById('posterCaption');
    if (posterCaption) {
        posterCaption.textContent = t.posterCaption;
    }

    document.querySelectorAll('.badge').forEach(badge => {
        const text = badge.textContent;
        const match = text.match(/第\s*(\d+)\s*题/);
        if (match) {
            badge.textContent = `${t.questionPrefix}${match[1]}${t.questionSuffix}`;
        } else if (text === '补充题') {
            badge.textContent = t.specialQuestion;
        }
    });

    document.querySelectorAll('.question-meta > div:last-child').forEach(el => {
        if (el.textContent === '维度已隐藏' || el.textContent === '维度已隐藏') {
            el.textContent = t.hiddenDim;
        }
    });
}