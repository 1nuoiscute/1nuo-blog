---
title: The world is my oyster
date: 2026-02-11 10:03:59
categories:
  - 建站经历
tags:
  - Hexo
  - Butterfly
  - Vercel
  - 建站
  - Cloudflare
top_img: https://img.1nuo.me/img/pagebanner1%2026211.webp
---
## Chapter 1: The Motive
The motivation for this project came from a simple observation: a friend's personal website. It was a technically impressive build, but more importantly, it represented complete ownership over one's digital presence. This resonated with a long-held desire of my own: to create a centralized, self-owned platform for my writings. Writing has long been a consistent habit of mine, and I wanted a proper home for that content. While I've always been hesitant due to a perceived lack of skill, this time I decided to commit to the process.
## Chapter 2: Choosing the Stack
As someone relatively new to web development, building a site from scratch wasn't a practical option. My primary goal was to find a solution that was mature, well-documented, and highly customizable. After some research, guided by **Gemini** and a crucial tutorial by "[星河梦瑾](https://blog.csdn.net/2401_83582688/article/details/144380760)" on CSDN, I settled on the following stack: `Hexo`+`Butterfly`.

---

*   #### The Foundation: `Hexo`
    *   A fast, simple, and powerful Static Site Generator (SSG). It allows me to write in Markdown and compiles everything into a complete, performant website.
*   #### The Design System: `Butterfly` 
    *   It's feature-rich, actively maintained, and offers extensive configuration options, satisfying my need for a personalized aesthetic.

---
To be honest, my choice was heavily influenced by the availability of high-quality tutorials and the maturity of the ecosystem, which is ideal for someone like me without any technical backgrounds.
## Chapter 3: The Showcase
### The Homepage & A Dynamic Welcome
![alt](https://img.1nuo.me/img/mainpage126211.webp "The Homepage")
The homepage greets every visitor with a full-screen banner image and a dynamic, typewriter-style subtitle. The main navigation menu provides clear, one-click access to all key sections of the site.
### The Owner Card 
![alt](https://img.1nuo.me/img/ownercard126211.webp "The Owner Card")
The sidebar features a prominent author card, complete with a custom avatar and social media links. This section acts as my digital name card, connecting my blog to my other presences across the web, from GitHub to various Chinese platforms like Bilibili and CSDN.
### Comments & Live Chat
![alt](https://img.1nuo.me/img/chatandcomment126211.webp "Comments & Live Chat")
To foster discussion, I've implemented a dual-comment system (depended on butterfly theme). It defaults to [Giscus](https://giscus.app/zh-CN) (GitHub-based) option for easy, anonymous feedback, but also offers a [Twikoo](https://twikoo.js.org/intro.html) option for someone without Github alts. For real-time interaction, a Tidio chatbot is integrated, allowing visitors to connect with me directly (shout out to Gemini!).
*~~非常好笑的是加Twikoo的目的是为了让不能科学上网的人也能评论但是做完了才发现不科学上网也用不了Twikoo...~~*
### The Navigation
![alt](https://img.1nuo.me/img/na126211.webp "The Navigation")
To provide structure and easy access to different types of content, I configured a comprehensive navigation menu.
* **Instant Search:** Integrated into the top navigation bar is a local search button. It allows for instant, client-side searching across all post titles and content without needing an external server. It's incredibly fast and makes finding specific information effortless.
* **Categories & Tags:** These two pages are the backbone of my content organization. They allow visitors to explore posts based on broad topics (Categories) or specific keywords (Tags), making content discovery intuitive.
* **Friend-Link & About:** The "Friend-Link" page is my connection to the wider blogosphere, a space to showcase other creators I admire. The "About" page serves as my personal profile, offering more details about myself and my work, including access to my [Academic](/academic/) page.
## Chapter 4: The Deployment
My deployment architecture consists of three core, free-tier services working in harmony:
### The Core
* **GitHub**: **The Source Code Repository.** My entire Hexo project folder (1nuo-blog-source) lives here. It acts as the single source of truth for my blog's content and configuration.
* **Vercel**: **The Build & Hosting Platform.** Vercel is connected to my GitHub repository. Whenever I git pusha new change, Vercel automatically pulls the source code, runs thehexo generate command in the cloud, and deploys the resulting static site to its global network.
* **Cloudflare**: **The DNS & Performance Layer.** Cloudflare sits in front of everything. It manages my custom domain (1nuo.me), provides a global CDN to accelerate content delivery, and handles security features like SSL.
### The Architecture
Here’s how the data flows from my computer to the end user:
####  My Local Machine
This is where it all begins. I write a new post, make a configuration change, and then execute a simple git push. This single command triggers the entire automated chain reaction.
#### GitHub 
Thegit push sends my project's source code—not the final website—to a private repository on GitHub. This repository acts as the definitive, version-controlled backup of my entire blog.
#### Vercel 
Vercel is constantly listening for changes in my GitHub repository. The moment it detects the new push, it springs into action: it pulls the source code, sets up a cloud environment, installs all dependencies, runshexo generate, and deploys the resulting static public folder to its global Edge Network.
#### Cloudflare
Finally, my custom domain,1nuo.me, is managed by Cloudflare. It points to the Vercel deployment and adds a critical layer of performance and security. It provides a global CDN to cache my assets close to the user and serves my site over a secure SSL connection.
![alt](https://img.1nuo.me/img/lct126211.webp)
### Key Challenges & Solutions
Here are some of the critical issues I encountered and how I solved them:
* **git pushNetwork Errors in Mainland China:** The initialgit pushattempts via HTTPS consistently failed with Connection was reset errors. 
  **Solution:** I configured an **SSH key** for my GitHub account and switched the remote URL to the SSH format . This provided a much more stable and reliable connection.
## Chapter 5: Conclusion
Now that the infrastructure is in place, my focus shifts from "building" to "creating". My plan for 1nuo.me includes:
* **Consistent Content Creation:** My primary goal is to start writing regularly, sharing my notes and insights on topics I'm passionate about. And i also will share the details of my life.
* **Continuous Improvement & Optimization:** This site is now my personal playground. I will continue to explore new features, optimize performance, and fine-tune the user experience. The journey of learning and improving the site itself is part of the fun.
* **Community Engagement:** I'm looking forward to connecting with other bloggers by exchanging friend-links and engaging in discussions in the comments.


Thank you for joining me on this journey. If you have any questions or feedback, feel free to leave a comment below or reach out via the Tidio chat. 

<font color="blue">The world is my oyster, which I with sword will open.</font>