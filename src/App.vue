<template>
  <div id="root">
    <header>
      <!-- <Publicity v-show="!running" /> -->
      <el-button
        :disabled="resultBtnDisabled"
        class="res"
        type="text"
        @click="showResult = true"
      >
        Lucky Draw Results
      </el-button>
      <el-button class="con" type="text" @click="showConfig = true">
        Lucky Draw Config
      </el-button>
    </header>
    <div id="main" :class="{ mask: showRes }"></div>
    <div id="tags">
      <ul v-for="item in datas" :key="item.key">
        <li>
          <a
            href="javascript:void(0);"
            :style="{
              color: '#f80'
            }"
          >
            <!-- 🧜 👺 🐢{{ item.name ? item.name : item.key }}🍉 😊 🌊 -->
            {{ item.name ? item.name : item.key }}
            <img v-if="item.photo" :src="item.photo" :width="50" :height="50" />
          </a>
        </li>
      </ul>
    </div>
    <transition name="bounce">
      <div id="resbox" v-show="showRes">
        <div class="title" @click="showRes = false">{{ categoryName }}：</div>
        <div class="container">
          <div
            v-for="item in resArr"
            :key="item"
            class="itemres"
            :style="resCardStyle"
            :data-id="item"
            @click="showRes = false"
            :class="{
              numberOver:
                !!photos.find(d => d.id === item) ||
                !!list.find(d => d.key === item)
            }"
          >
            <!-- 抽奖结果展示 -->
            <div class="cont" v-if="!photos.find(d => d.id === item)">
              <template v-if="!!list.find(d => d.key === item)">
                <img
                  class="company-logo"
                  v-if="list.find(d => d.key === item).photo"
                  :src="list.find(d => d.key === item).photo"
                  alt=""
                />
                <div class="company-name">
                  {{ list.find(d => d.key === item).compNameCn }}
                </div>
                <div class="company-name">
                  {{ list.find(d => d.key === item).compNameEn }}
                </div>
              </template>
              <span v-else> {{ item }} 没找到 </span>
            </div>
            <img
              v-if="photos.find(d => d.id === item)"
              :src="photos.find(d => d.id === item).value"
              alt="photo"
              :width="160"
              :height="160"
            />
          </div>
        </div>
      </div>
    </transition>

    <!-- <el-button
      class="audio"
      type="text"
      @click="
        () => {
          playAudio(!audioPlaying);
        }
      "
    >
      <i
        class="iconfont"
        :class="[audioPlaying ? 'iconstop' : 'iconplay1']"
      ></i>
    </el-button> -->

    <LotteryConfig
      :visible.sync="showConfig"
      @refresh="getInitList"
      @resetconfig="reloadTagCanvas"
    />
    <Tool
      @toggle="toggle"
      @refresh="getInitList"
      @resetConfig="reloadTagCanvas"
      @getPhoto="getPhoto"
      :running="running"
      :closeRes="closeRes"
    />
    <Result :visible.sync="showResult"></Result>

    <!-- <audio
      id="audiobg"
      preload="auto"
      controls
      autoplay
      loop
      @play="playHandler"
      @pause="pauseHandler"
    >
      <source :src="audioSrc" />
      你的浏览器不支持audio标签
    </audio> -->
  </div>
</template>
<script>
import LotteryConfig from '@/components/LotteryConfig';
// import Publicity from '@/components/Publicity';
import Tool from '@/components/Tool';
import bgaudio from '@/assets/bg.mp3';
import beginaudio from '@/assets/begin.mp3';
import {
  getData,
  configField,
  resultField,
  newLotteryField,
  conversionCategoryName,
  listField,
  formatList
} from '@/helper/index';
import { luckydrawHandler } from '@/helper/algorithm';
import Result from '@/components/Result';
import { database, DB_STORE_NAME } from '@/helper/db';
import { getPartInCompListApi, addRecordApi } from '@/api';
// import { listall } from '@/api/testData';

export default {
  name: 'App',

  components: {
    LotteryConfig,
    // Publicity,
    Tool,
    Result
  },

  computed: {
    resCardStyle() {
      const style = { fontSize: '30px' };
      const { number } = this.config;
      if (number < 100) {
        style.fontSize = '14px';
      } else if (number < 1000) {
        style.fontSize = '80px';
      } else if (number < 10000) {
        style.fontSize = '60px';
      }
      return style;
    },
    config: {
      get() {
        return this.$store.state.config;
      }
    },
    result: {
      get() {
        return this.$store.state.result;
      },
      set(val) {
        this.$store.commit('setResult', val);
      }
    },
    list() {
      return this.$store.state.list;
    },
    allresult() {
      let allresult = [];
      for (const key in this.result) {
        if (this.result.hasOwnProperty(key)) {
          const element = this.result[key];
          allresult = allresult.concat(element);
        }
      }
      return allresult;
    },

    // 页面上渲染的数据
    datas() {
      const { number } = this.config;
      const nums = number >= 1500 ? 500 : this.config.number;
      const configNum = number > 1500 ? Math.floor(number / 3) : number;
      const randomShowNums = luckydrawHandler(configNum, [], nums);
      const randomShowDatas = randomShowNums.map(item => {
        const listData = this.list.find(d => d.key === item);
        // const photo = this.photos.find(d => d.id === item);
        return {
          key: item * (number > 1500 ? 3 : 1),
          name: listData ? listData.name : '',
          compNameCn: listData ? listData.compNameCn : '',
          compNameEn: listData ? listData.compNameEn : '',
          // photo: photoUrl
          photo: listData ? listData.photo : ''
        };
      });

      return randomShowDatas;
    },
    categoryName() {
      return conversionCategoryName(this.category);
    },
    photos() {
      return this.$store.state.photos;
    }
  },
  created() {
    // 获取配置数据
    const data = getData(configField);
    if (data) {
      this.$store.commit('setConfig', Object.assign({}, data));
    }

    // 获取中奖结果
    const result = getData(resultField);
    if (result) {
      this.$store.commit('setResult', result);
    }

    // 获取新增配置项数据
    const newLottery = getData(newLotteryField);
    if (newLottery) {
      const config = this.config;
      newLottery.forEach(item => {
        this.$store.commit('setNewLottery', item);
        if (!config[item.key]) {
          this.$set(config, item.key, 0);
        }
      });
      this.$store.commit('setConfig', config);
    }

    // 获取抽奖人员列表
    const list = getData(listField);
    if (list) {
      this.$store.commit('setList', list);
    }
  },

  data() {
    return {
      // 抽奖结果按钮是否可以点击
      resultBtnDisabled: false,
      running: false,
      showRes: false,
      showConfig: false,
      showResult: false,
      resArr: [],
      category: '',
      audioPlaying: false,
      audioSrc: bgaudio
    };
  },
  watch: {
    photos: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.reloadTagCanvas();
        });
      }
    }
  },
  async mounted() {
    await this.getInitList();
    this.startTagCanvas();
    setTimeout(() => {
      this.getPhoto();
    }, 1000);
    window.addEventListener('resize', this.reportWindowSize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.reportWindowSize);
  },
  methods: {
    // 获取初始化抽奖人列表
    async getInitList() {
      const params = {
        sessionId: 81 // 本次测试环境用81
      };
      if (localStorage.getItem('sessionId')) {
        params.sessionId = localStorage.getItem('sessionId');
      } else {
        localStorage.setItem('sessionId', params.sessionId);
      }
      const res = await getPartInCompListApi(params);

      // res.records = res.records.concat(listall);

      this.$store.commit(
        'setConfig',
        Object.assign({}, this.config, {
          // number: res.total > 70 ? res.total : 70
          number: res.records.length
        })
      );

      this.$store.commit('setList', formatList(res.records));

      this.$nextTick(() => {
        this.reloadTagCanvas();
      });
    },
    reportWindowSize() {
      const AppCanvas = this.$el.querySelector('#rootcanvas');
      if (AppCanvas.parentElement) {
        AppCanvas.parentElement.removeChild(AppCanvas);
      }
      this.startTagCanvas();
    },
    playHandler() {
      this.audioPlaying = true;
    },
    pauseHandler() {
      this.audioPlaying = false;
    },
    // eslint-disable-next-line no-unused-vars
    playAudio(type) {
      // if (type) {
      //   this.$el.querySelector('#audiobg').play();
      // } else {
      //   this.$el.querySelector('#audiobg').pause();
      // }
    },
    loadAudio() {
      // this.$el.querySelector('#audiobg').load();
      // this.$nextTick(() => {
      //   this.$el.querySelector('#audiobg').play();
      // });
    },

    // 获取照片信息
    getPhoto() {
      database.getAll(DB_STORE_NAME).then(res => {
        if (res && res.length > 0) {
          console.log(res, '数据库中获取图片信息');
          this.$store.commit('setPhotos', res);
        }
      });
    },

    // canvas 旋转速度
    speed() {
      return [0.1 * Math.random() + 0.01, -(0.1 * Math.random() + 0.01)];
    },

    // 创建canvas
    createCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = document.body.offsetWidth;
      canvas.height = document.body.offsetHeight;
      canvas.id = 'rootcanvas';
      this.$el.querySelector('#main').appendChild(canvas);
    },

    // 生成canvas
    startTagCanvas() {
      this.createCanvas();
      const { speed } = this;
      window.TagCanvas.Start('rootcanvas', 'tags', {
        textColour: null,
        initial: speed(),
        dragControl: 1,
        textHeight: 20,
        noSelect: true,
        lock: 'xy'
      });
    },

    // 重新刷新canvas
    async reloadTagCanvas() {
      window.TagCanvas.Reload('rootcanvas');
    },

    // 关闭操作
    closeRes() {
      this.showRes = false;
    },
    toggle(form) {
      const { speed, config } = this;

      // console.log(this.running, speed, config, 'toggle');

      if (this.running) {
        console.log('running is true');
        this.resultBtnDisabled = false;
        // 停止摇奖动画
        this.audioSrc = bgaudio;
        this.loadAudio();

        window.TagCanvas.SetSpeed('rootcanvas', speed());
        this.showRes = true;
        this.running = !this.running;
        this.$nextTick(() => {
          this.reloadTagCanvas();
        });
      } else {
        // 运行摇奖动画 得出随机结果
        this.showRes = false;
        if (!form) {
          return;
        }

        this.audioSrc = beginaudio;
        this.loadAudio();

        const { number } = config;
        const { category, mode, qty, remain, allin, countMap } = form;
        let num = 1;
        if (mode === 1 || mode === 5) {
          num = mode;
        } else if (mode === 0) {
          num = remain;
        } else if (mode === 99) {
          num = qty;
        }
        const resArr = luckydrawHandler(
          number,
          allin ? [] : this.allresult,
          num
        );
        this.resArr = resArr;

        this.category = category;
        if (!this.result[category]) {
          this.$set(this.result, category, []);
        }
        const oldRes = this.result[category] || [];
        console.log(resArr, '结果是什么', category, this.result[category]);
        // console.log(countMap.get(category), '取第几次抽奖， countMap');
        const data = Object.assign({}, this.result, {
          [category]: oldRes.concat(resArr)
        });

        // 上报结果
        this.addRecord(resArr, category, countMap.get(category));

        // console.log(data, 'data...');
        this.result = data;
        window.TagCanvas.SetSpeed('rootcanvas', [1.2, 1]);
        this.running = !this.running;

        this.resultBtnDisabled = true;
      }
    },

    /**
     * 添加中奖记录
     * @param {*} indexArr 序列数组
     * @param {*} category 当前奖励类型
     * @param {*} countNum 该奖项抽了多少次
     */
    async addRecord(indexArr, category, countNum) {
      const rr = [];
      indexArr.forEach(indexItem => {
        const currentItem = this.list.find(item => item.key === indexItem);
        rr.push(currentItem);
      });
      const sessionId = this.$store.state.sessionId;
      const params = rr.map(item => {
        return {
          sessionId,
          compId: item.id,
          compNameCn: item.compNameCn,
          compNameEn: item.compNameEn,
          compLogo: item.photo,
          awardsName: conversionCategoryName(category),
          awardsCode: category,
          awardsTimes: countNum
        };
      });

      // console.log(params, '上报的参数啊啊啊啊啊啊啊啊啊');
      await addRecordApi(params);
    }
  }
};
</script>
<style lang="scss">
#root {
  height: 100%;
  position: relative;
  background-image: url('./assets/bg1.jpg');
  background-size: 100% 100%;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #121936;
  .mask {
    -webkit-filter: blur(5px);
    filter: blur(5px);
  }
  header {
    height: 50px;
    line-height: 50px;
    position: relative;
    .el-button {
      position: absolute;
      top: 17px;
      padding: 0;
      z-index: 9999;
      &.con {
        right: 20px;
      }
      &.res {
        right: 180px;
      }
    }
  }
  .audio {
    position: absolute;
    top: 100px;
    right: 30px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    border: 1px solid #fff;
    border-radius: 50%;
    padding: 0;
    text-align: center;
    .iconfont {
      position: relative;
      left: 1px;
    }
  }
  .copy-right {
    position: absolute;
    right: 0;
    bottom: 0;
    color: #ccc;
    font-size: 12px;
  }
  .bounce-enter-active {
    animation: bounce-in 1.5s;
  }
  .bounce-leave-active {
    animation: bounce-in 0s reverse;
  }
}
#main {
  height: 100%;
}

#resbox {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  transform: translateX(-50%) translateY(-50%);
  text-align: center;

  .title {
    font-size: 50px;
    line-height: 120px;
    font-family: ShuHeiTi, 'Courier New', Courier, monospace;
    background: linear-gradient(to bottom, #ffffff, #dbe4fe, #ffffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
  .container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    max-height: 90vh;
    overflow-y: auto;
  }
  .itemres {
    // background: #fff;
    background: linear-gradient(to bottom, #222324, #3a4986);
    width: 18%;
    height: 280px;
    border-radius: 4px;
    border: 2px solid #5c7bff;
    line-height: 80px;
    font-weight: bold;
    margin-right: 20px;
    margin-bottom: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .cont {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .company-name {
        // color: #6275c1;
        color: #fff;
        font-size: 20px;
        line-height: 1.5;
        padding: 0 20px;
        // display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 350px;
      }

      .company-logo {
        width: 285px;
        height: 160px;
      }
    }

    &.numberOver::before {
      display: none;
      content: attr(data-id);
      width: 30px;
      height: 22px;
      line-height: 22px;
      background-color: #fff;
      position: absolute;
      bottom: 0;
      left: 0;
      font-size: 14px;
      // border-radius: 50%;
      z-index: 1;
    }
  }
}
</style>
