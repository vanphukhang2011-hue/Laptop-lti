"use strict";

const byId = (id) => document.getElementById(id);
const all = (selector) => [...document.querySelectorAll(selector)];
const number = (value) => Math.round(value).toLocaleString("vi-VN");
const money = (value) => `${number(value)} ₫`;
let selectedConfig = 1;

function setDetail(id, title, description) {
  const node = byId(id);
  node.replaceChildren(document.createTextNode(title));
  const detail = document.createElement("span");
  detail.textContent = description;
  node.append(detail);
}

function updateBudget() {
  const config = configurations[selectedConfig];
  const months = Number(byId("months").value);
  byId("months-output").value = `${months} tháng`;
  byId("months").setAttribute("aria-valuetext", `${months} tháng`);
  byId("monthly-payment").replaceChildren(
    document.createTextNode(number(config.price / months) + " "),
  );
  const suffix = document.createElement("span");
  suffix.textContent = "₫ / tháng";
  byId("monthly-payment").append(suffix);
  byId("daily-payment").textContent =
    `Tương đương khoảng ${money(config.price / months / 30)} / ngày.`;
  all("[data-months]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.months) === months),
    );
    button.setAttribute("aria-label", `${button.dataset.months} tháng`);
  });
  const rows = [
    ["CPU", "cpuShort"],
    ["RAM", "ramShort"],
    ["Đồ họa", "gpuShort"],
    ["Màn hình", "scrShort"],
    ["Giá tham khảo", (config) => money(config.price)],
    [
      `Chia đều ${months} tháng`,
      (config) => `${money(config.price / months)} / tháng`,
    ],
  ];
  const fragment = document.createDocumentFragment();
  rows.forEach(([label, field]) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = label;
    row.append(heading);
    configurations.forEach((item, index) => {
      const cell = document.createElement("td");
      cell.textContent =
        typeof field === "function" ? field(item) : item[field];
      cell.classList.toggle("selected-col", index === selectedConfig);
      row.append(cell);
    });
    fragment.append(row);
  });
  byId("comparison-body").replaceChildren(fragment);
}

const configNotes = [
  "Phương án này giảm 2.400.000 ₫ so với cấu hình con đề xuất, với 16GB RAM và màn hình 165Hz. Đây là lựa chọn cần cân nhắc nếu ưu tiên giảm chi phí ban đầu; nếu tự nâng thêm 16GB RAM thì chi phí tham khảo khoảng 1,5 triệu đồng và phải mở nắp máy.",
  "Mức chênh 2.400.000 ₫ so với bản thấp nhất mang lại 32GB RAM có sẵn và màn hình 240Hz. Cơ sở chính cho lựa chọn của con là dung lượng bộ nhớ phục vụ đa nhiệm, đồng thời hạn chế nhu cầu nâng cấp RAM ngay sau khi mua.",
  "Phương án này có RTX 5070, 16GB RAM và màn hình FHD+, với chi phí cao hơn cấu hình đề xuất 3.600.000 ₫. Phần đầu tư tăng thêm cần được đối chiếu với nhu cầu đồ họa thực tế trước khi lựa chọn.",
  "Phương án này kết hợp 32GB RAM, RTX 5070 và màn hình 2.5K 240Hz, cao hơn cấu hình đề xuất 5.600.000 ₫. Với nhu cầu hiện tại, con chưa đề xuất khoản chi bổ sung này để giữ mức đầu tư hợp lý.",
];

function chooseConfig(index) {
  const config = configurations[index];
  if (!config) return;
  selectedConfig = index;
  all("[data-config]").forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.config) === index),
    ),
  );
  all("th[data-col]").forEach((cell) =>
    cell.classList.toggle("selected-col", Number(cell.dataset.col) === index),
  );
  byId("hero-config").textContent =
    `${config.cpuShort} · ${config.ramShort} · ${config.gpuShort} · 1TB SSD`;
  byId("hero-price").textContent = money(config.price);
  byId("config-reason").textContent = configNotes[index];
  setDetail("spec-cpu", config.cpuShort, `${config.cores} ${config.threads}`);
  setDetail("spec-ram", config.ramShort, config.ramTitle);
  setDetail("spec-gpu", config.gpuShort, "8GB GDDR7");
  setDetail("spec-screen", config.scrShort, config.scrDesc);
  byId("budget-selected").textContent =
    `${config.cpuShort} · ${config.ram}GB · ${config.gpuShort}`;
  byId("total-price").textContent = money(config.price);
  byId("budget-save").textContent = `Giá gốc ${config.oldPrice} · ${config.saveText.replace(" so với giá gốc", "")}`;
  byId("ownership-cost").textContent =
    `Khoảng ${money(config.price / 48)} / tháng`;
  updateBudget();
}

all("[data-config]").forEach((button) =>
  button.addEventListener("click", () =>
    chooseConfig(Number(button.dataset.config)),
  ),
);
all("[data-months]").forEach((button) =>
  button.addEventListener("click", () => {
    byId("months").value = button.dataset.months;
    updateBudget();
  }),
);
byId("months").addEventListener("input", updateBudget);
chooseConfig(1);

const studies = {
  code: [
    "Nhiều tác vụ cùng lúc.",
    "Trong một buổi thực hành, con thường mở cùng lúc trình biên dịch C++, Docker, máy ảo Linux và khoảng 20 thẻ tài liệu. Khi thiếu bộ nhớ, con phải đóng bớt ứng dụng và mạch thực hành bị gián đoạn.",
    "Yêu cầu cần đáp ứng: có dư địa bộ nhớ cho việc học chuyên Tin và dự án CLB IST.",
  ],
  ielts: [
    "Duy trì tiến độ ôn luyện.",
    "Con ôn viết và đọc đề IELTS khoảng 21:30 – 23:00 mỗi tối, dùng màn hình 27 inch hiện có để chữ rõ, đỡ mỏi mắt. Ở chế độ Silent, quạt có thể dừng khi tải nhẹ nên không làm phiền cả nhà.",
    "Yêu cầu cần đáp ứng: công cụ thuận tiện và lịch ôn IELTS được ba mẹ cùng theo dõi.",
  ],
  ai: [
    "Chuẩn bị cho đại học.",
    "Khi học Công nghệ thông tin, con muốn tự chạy thử các mô hình AI cỡ nhỏ ngay trên máy, thay vì thuê máy chủ đám mây mỗi tháng. Đây là lý do con cần card đồ họa rời và bộ nhớ đủ rộng, trong ngân sách ba mẹ đồng ý.",
    "Yêu cầu cần đáp ứng: phục vụ nhu cầu hiện tại và có phương án mở rộng khi thực sự cần.",
  ],
};
const studyTabs = all("[data-study]");
const studyWorkspaces = {
  code: [
    "C++",
    "Tài liệu",
    "Linux / Docker",
    "Một buổi thực hành, nhiều công cụ cùng mở.",
  ],
  ielts: [
    "Bài viết",
    "Tài liệu",
    "Tra cứu",
    "Bố trí tài liệu và bài viết trong cùng không gian học.",
  ],
  ai: [
    "Máy ảo",
    "Bài tập lớn",
    "Mô hình AI",
    "Mở rộng theo từng dự án và nhu cầu thực tế.",
  ],
};
function selectStudy(button) {
  studyTabs.forEach((tab) => {
    const active = tab === button;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  const [title, description, detail] = studies[button.dataset.study];
  byId("study-title").textContent = title;
  byId("study-description").textContent = description;
  byId("study-detail").textContent = detail;
  const workspace = studyWorkspaces[button.dataset.study];
  ["study-tool-a", "study-tool-b", "study-tool-c", "study-map-caption"].forEach(
    (id, index) => {
      byId(id).textContent = workspace[index];
    },
  );
  byId("study-panel").setAttribute("aria-labelledby", button.id);
}
studyTabs.forEach((button, index) => {
  button.addEventListener("click", () => selectStudy(button));
  button.addEventListener("keydown", (event) => {
    let next;
    if (["ArrowRight", "ArrowDown"].includes(event.key))
      next = (index + 1) % studyTabs.length;
    if (["ArrowLeft", "ArrowUp"].includes(event.key))
      next = (index + studyTabs.length - 1) % studyTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = studyTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectStudy(studyTabs[next]);
    studyTabs[next].focus();
  });
});

const parts = [
  [
    "Không gian học tập rộng.",
    "Tỉ lệ 16:10 hỗ trợ hiển thị mã nguồn và tài liệu trong quá trình học. Màn hình 16 inch 2.5K, 240Hz, độ sáng 500 nits, 100% DCI-P3; có camera hồng ngoại để đăng nhập Windows Hello. Ở nhà, con kết nối thêm màn hình 27 inch hiện có.",
  ],
  [
    "Thuận tiện khi sử dụng.",
    "Bàn phím và bàn rê ảnh hưởng trực tiếp đến việc lập trình và soạn thảo. Máy có micro lọc ồn cho các buổi học trực tuyến. Trước khi mua, con sẽ gõ thử để kiểm tra độ thoải mái khi dùng lâu.",
  ],
  [
    "Ổn định khi làm việc.",
    "Hãng dùng keo kim loại lỏng cho CPU và quạt Arc Flow để đẩy nhiệt ra ngoài khi xử lý tác vụ nặng. Con sẽ đặt máy ở nơi thông thoáng, không che khe gió và vệ sinh định kỳ.",
  ],
  [
    "Khả năng mở rộng.",
    "Cấu hình đề xuất lắp sẵn 2 thanh RAM 16GB và SSD 1TB; theo hãng còn một khe M.2 trống để thêm ổ cứng. Con sẽ xác nhận lại với đúng mã máy trước khi mua.",
  ],
];
all("[data-part]").forEach((button) =>
  button.addEventListener("click", () => {
    const index = Number(button.dataset.part);
    all("[data-part]").forEach((item) =>
      item.setAttribute(
        "aria-pressed",
        String(Number(item.dataset.part) === index),
      ),
    );
    byId("part-title").textContent = parts[index][0];
    byId("part-description").textContent = parts[index][1];
  }),
);

const modes = {
  silent:
    "Con chuyển chế độ bằng phần mềm Armoury Crate của máy, và ưu tiên Silent khi đọc tài liệu, luyện thi IELTS. Quạt có thể giảm tốc hoặc dừng ở mức tải nhẹ; độ ồn thực tế phụ thuộc nhiệt độ và tác vụ đang thực hiện.",
  code: "Con sử dụng chế độ cân bằng khi lập trình, chạy máy ảo và phát triển web. Khi biên dịch làm tăng tiếng quạt, con sẽ điều chỉnh chế độ và thời gian làm việc phù hợp với sinh hoạt gia đình.",
  ai: "Tác vụ AI có thể tiêu thụ nhiều điện và tăng tiếng quạt. Con sẽ kết nối nguồn điện, đặt máy tại vị trí thông thoáng và chỉ thực hiện trong khung giờ phù hợp với sinh hoạt chung.",
};
const scenarioSources = {
  silent: [
    "Unsplash",
    "https://images.unsplash.com/photo-1548393488-ae8f117cbc1c",
  ],
  code: [
    "Mohammad Rahmani / Unsplash",
    "https://unsplash.com/photos/black-laptop-computer-turned-on-displaying-blue-screen-CygdSoUmmqg",
  ],
  ai: [
    "Immo Wegmann / Unsplash",
    "https://unsplash.com/photos/glowing-ai-chip-on-a-circuit-board-w69Z8K-HGQU",
  ],
};
all("[data-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    all("[data-mode]").forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    byId("mode-description").textContent = modes[button.dataset.mode];
    const selectedMode = button.dataset.mode;
    document.querySelector(".scenario-figure").dataset.scenario = selectedMode;
    all("[data-scenario-image]").forEach((image) => {
      const active = image.dataset.scenarioImage === selectedMode;
      image.classList.toggle("is-active", active);
      image.setAttribute("aria-hidden", String(!active));
    });
    const [credit, url] = scenarioSources[selectedMode];
    byId("scenario-source").textContent = credit;
    byId("scenario-source").href = url;
  }),
);

const lightNotes = {
  off: "Ảnh được điều chỉnh độ sáng nhằm minh họa trạng thái tắt đèn; không phải ảnh chụp riêng của chế độ này.",
  white:
    "Ảnh minh họa ở tông trung tính. Trong lớp học hoặc thư viện, con sẽ tắt đèn màu bằng phần mềm điều khiển của máy.",
  on: "Ảnh minh họa hệ thống đèn màu của sản phẩm. Con chỉ sử dụng chế độ này tại nhà khi phù hợp với không gian sinh hoạt chung.",
};
all("button[data-light]").forEach((button) =>
  button.addEventListener("click", () => {
    all("button[data-light]").forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    byId("lighting-photo").dataset.light = button.dataset.light;
    byId("lighting-note").textContent = lightNotes[button.dataset.light];
  }),
);

const nav = document.querySelector(".nav");
const menu = document.querySelector(".menu-toggle");
nav.classList.add("enhanced");
function closeMenu() {
  nav.classList.remove("menu-open");
  menu.setAttribute("aria-expanded", "false");
}
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("menu-open");
  menu.setAttribute("aria-expanded", String(open));
});
all(".nav-links a").forEach((link) =>
  link.addEventListener("click", closeMenu),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("menu-open")) {
    closeMenu();
    menu.focus();
  }
});

byId("agree").addEventListener("click", () => {
  byId("discussion").hidden = true;
  byId("discuss").setAttribute("aria-expanded", "false");
  byId("decision-result").textContent =
    "Con cảm ơn ba mẹ đã tin tưởng. Trước khi mua, con sẽ cùng ba mẹ xác nhận giá, kiểm tra máy và thống nhất mục tiêu học tập, cách theo dõi điểm số cùng giới hạn sử dụng. Con cam kết điều chỉnh việc dùng máy nếu kết quả học tập sa sút.";
});
byId("discuss").addEventListener("click", () => {
  const open = byId("discussion").hidden;
  byId("discussion").hidden = !open;
  byId("discuss").setAttribute("aria-expanded", String(open));
  byId("decision-result").textContent = open
    ? "Con xin tiếp thu ý kiến của ba mẹ và sẵn sàng làm rõ những nội dung cần cân nhắc trước khi quyết định."
    : "";
});
all("[data-topic]").forEach((button) =>
  button.addEventListener("click", () => {
    button.setAttribute(
      "aria-pressed",
      String(button.getAttribute("aria-pressed") !== "true"),
    );
    const topics = all('[data-topic][aria-pressed="true"]').map(
      (item) => item.dataset.topic,
    );
    byId("decision-result").textContent = topics.length
      ? `Con sẽ chuẩn bị thông tin cụ thể về ${topics.join(", ")} để trình bày rõ hơn và tiếp thu ý kiến của ba mẹ.`
      : "Kính mời ba mẹ lựa chọn nội dung cần trao đổi thêm.";
  }),
);

/* "Trao đổi cùng ba mẹ": questions open on hover and close shortly after the mouse leaves
   (mouse only); clicking one pins it open until clicked again. */
(() => {
  const group = document.querySelector(".questions");
  if (!group || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const items = [...group.querySelectorAll("details")];
  items.forEach((d) => {
    let timer;
    const close = () => {
      if (d.dataset.hover && !d.matches(":hover")) {
        d.open = false;
        delete d.dataset.hover;
      }
    };
    d.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      // One answer at a time: shut the others hover opened, so the page never grows twice.
      items.forEach((o) => {
        if (o !== d && o.dataset.hover) {
          o.open = false;
          delete o.dataset.hover;
        }
      });
      if (!d.open) {
        d.open = true;
        d.dataset.hover = "1";
      }
    });
    d.addEventListener("mouseleave", () => {
      clearTimeout(timer);
      timer = setTimeout(close, 220);
    });
    d.querySelector("summary").addEventListener("click", (e) => {
      if (d.dataset.hover) {
        e.preventDefault(); // pin it open instead of toggling shut
        delete d.dataset.hover;
      }
    });
  });
})();
