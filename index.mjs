const ARMOR_TABLE_BODY = document.getElementById("armor-list-table-body");
const ITEM_TABLE_BODY = document.getElementById("item-list-table-body");
const STATE_KEY = "totk-armor-helper-state";

let get_state = () => {
    let raw = localStorage.getItem(STATE_KEY);
    if (!raw) {
        return {};
    }
    return JSON.parse(raw);
}

let save_state = (state) => {
    console.log("Save state!");
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let gen_style = (dark) => {
    return `background: ${dark ? "#008276" : "#fbbe49"}; color: ${dark ? "ghostwhite" : "#253324;"}`
}

let item_dark = false;
let add_item_row = (item_name, count) => {
    let tmp = document.getElementById("item-row-template").content.cloneNode(true).firstElementChild;
    let name = tmp.querySelector(".name");
    tmp.setAttribute("style", gen_style(item_dark));
    name.innerText = item_name;
    let ct = tmp.querySelector(".quantity");
    ct.innerText = count.toString();
    ITEM_TABLE_BODY.appendChild(tmp);
    item_dark = !item_dark;
}

let update_needed = (data) => {
    let state = get_state();
    let total_counts = {};
    /**
     * @type HTMLInputElement[]
     */
    let checks = Array.from(document.querySelectorAll(".upgrade-checkbox"));
    for (let check of checks) {
        if (!check.checked) {
            let item = data[check.dataset.itemName];
            let upgrade = item.upgrades[check.dataset.upgradeIndex];
            for (let key in upgrade) {
                let ct = upgrade[key];
                if (!total_counts[key]) {
                    total_counts[key] = 0;
                }
                total_counts[key] += ct;
            }
        }
    }
    while (ITEM_TABLE_BODY.hasChildNodes()) {
        ITEM_TABLE_BODY.removeChild(ITEM_TABLE_BODY.firstChild);
    }
    let keys = [];
    for (let key in total_counts) {
        keys.push(key);
    }
    for (let key of keys) {
        add_item_row(key, total_counts[key]);
    }
    save_state(state);
}

let gen_checkbox = (item_name, upgrade_level, state, update_cb) => {
    let ret = document.createElement("input");
    ret.setAttribute("type", "checkbox");
    let id = item_name.replace(/\s/g, "-").toLocaleLowerCase() + `-${upgrade_level}`;
    ret.setAttribute("id", id);
    ret.setAttribute("name", id);
    ret.addEventListener("change", update_cb);
    ret.dataset.itemName = item_name;
    ret.dataset.upgradeIndex = upgrade_level - 1;
    ret.checked = state;
    ret.classList.add("upgrade-checkbox");
    return ret;
}

let gen_materials = (mats, parent) => {
    let inner_text = [];
    for (let mat in mats) {
        let count = mats[mat];
        inner_text.push(`${mat} x ${count}`);
    }
    for (let mat of inner_text) {
        let span = document.createElement("span");
        span.innerText = mat;
        parent.appendChild(span);
    }
}
let dark = false;
let add_armor_row = (item_name, item_data, state, update_cb) => {
    /**
     * @type HTMLTemplateElement
     */
    let tmp = document.getElementById("armor-row-template").content.cloneNode(true);
    /**
     * @type HTMLTrElement
     */
    let [row_one, row_two, row_three, row_four] = Array.from(tmp.querySelectorAll('tr'));
    
    let name = row_one.querySelector(".name");
    name.innerText = item_name;
    
    if (item_data.upgrades[0]) {
        let one = row_one.querySelector(".upgrade-one");
        let checked = state[item_name] ? !!state[item_name][0] : false;
        one.appendChild(gen_checkbox(item_name, 1, checked, update_cb));
        gen_materials(item_data.upgrades[0], one);
    }
    if (item_data.upgrades[1]) {
        let two = row_two.querySelector(".upgrade-two");
        let checked = state[item_name] ? !!state[item_name][0] : false;
        two.appendChild(gen_checkbox(item_name, 2, checked, update_cb));
        gen_materials(item_data.upgrades[1], two);
    }
    if (item_data.upgrades[2]) {
        let three = row_three.querySelector(".upgrade-three");
        let checked = state[item_name] ? !!state[item_name][0] : false;
        three.appendChild(gen_checkbox(item_name, 3, checked, update_cb));
        gen_materials(item_data.upgrades[2], three);
    }
    if (item_data.upgrades[3]) {
        let four = row_four.querySelector(".upgrade-four");
        let checked = state[item_name] ? !!state[item_name][0] : false;
        four.appendChild(gen_checkbox(item_name, 4, checked, update_cb));
        gen_materials(item_data.upgrades[3], four);
    }
    for (let ele of [row_one, row_two, row_three, row_four]) {
        ele.setAttribute("style", gen_style(dark));
        ARMOR_TABLE_BODY.appendChild(ele);
    }
    dark = !dark;
}


let armor_type_sorter = (l, r) => {
    if (l == r) {
        return 0;
    }
    if (l == "hat" && r == "chest") {
        return -1;
    }
    if (l == "hat" && r == "legs") {
        return -2;
    }
    if (l == "chest" && r == "hat") {
        return 1;
    }
    if (l == "chest" && r == "legs") {
        return -1;
    }
    if (l == "legs" && r == "hat") {
        return 2;
    }
    if (l == "legs" && r == "chest") {
        return 1;
    }
    return 0;
}

async function main() {
    let data_res = await fetch("data.json");
    if (!data_res.ok) {
        throw new Error(`ERROR fetching data!: ${await data_res.text()}`);
    }
    let data = await data_res.json();
    let raw_state = localStorage.getItem(STATE_KEY);
    if (!raw_state) {
        raw_state = "{}";
        localStorage.setItem(STATE_KEY, raw_state);
    }
    let state = get_state();
    
    let update_cb = () => {
        update_needed(data);
    };
    let armor_keys = []
    for (let key in data) {
        armor_keys.push(key);
    }
    armor_keys.sort((l, r) => {
        let dataL = data[l];
        let dataR = data[r];
        let setIndexL = data[l].setIndex;
        let setIndexR = data[r].setIndex;
        if (dataL.setIndex == dataR.setIndex) {
            return armor_type_sorter(dataL.type, dataR.type);
        }
        return setIndexL - setIndexR;

    })
    for (let key of armor_keys) {
        add_armor_row(key, data[key], state, update_cb);
    }
    update_needed(data);
}

document.addEventListener("DOMContentLoaded", main);
