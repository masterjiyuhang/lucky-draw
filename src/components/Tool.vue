<template>
  <div id="tool">
    <!-- <el-select v-model="currentCategory">
      <el-option
        :label="item.label"
        :value="item.value"
        v-for="(item, index) in categorys"
        :key="index"
      ></el-option
    ></el-select> -->
    <el-button @click="startHandler" type="primary" size="mini">{{
      running ? 'Stop' : 'Start'
    }}</el-button>
    <el-button size="mini" @click="showRemoveoptions = true">
      Reset
    </el-button>
    <!-- <el-button size="mini" @click="showImport = true">
      导入名单
    </el-button>
    <el-button size="mini" @click="showImportphoto = true">
      导入照片
    </el-button> -->
    <el-dialog
      :append-to-body="true"
      :visible.sync="showSetwat"
      class="setwat-dialog"
      width="350px"
    >
      <el-form ref="form" :model="form" label-width="95px" size="mini">
        <el-form-item label="Lucky Draw">
          <el-select v-model="form.category" placeholder="">
            <el-option
              :label="item.label"
              :value="item.value"
              v-for="(item, index) in categorys"
              :key="index"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label=" " v-if="form.category">
          <span>
            Total&nbsp;
            <span class="colorred">{{ config[form.category] }}</span>
            &nbsp;
          </span>
          <span :style="{ marginLeft: '20px' }">
            Remaining&nbsp;
            <span class="colorred">{{ remain }}</span>
            &nbsp;
          </span>
          <div></div>
          <span>
            Prize pool remaining&nbsp;
            <span class="colorred">{{ poolRemaining }}</span>
            &nbsp;
          </span>
        </el-form-item>
        <!-- 
        <el-form-item label="抽取方式">
          <el-select
            v-model="form.mode"
            placeholder="请选取本次抽取方式"
            @change="changeMode"
          >
            <el-option label="抽1人" :value="1"></el-option>
            <el-option label="抽5人" :value="5"></el-option>
            <el-option label="一次抽取完" :value="0"></el-option>
            <el-option label="自定义" :value="99"></el-option>
          </el-select>
        </el-form-item> -->

        <el-form-item label="抽取人数" v-if="form.mode === 99">
          <el-input
            v-model="form.qty"
            type="number"
            :clearable="true"
            :min="1"
            :max="remain ? remain : 100"
            :step="1"
          ></el-input>
        </el-form-item>
        <!-- 
        <el-form-item label="全员参与">
          <el-switch v-model="form.allin"></el-switch>
          <span :style="{ fontSize: '12px' }">
            (开启后将在全体成员[无论有无中奖]中抽奖)
          </span>
        </el-form-item> -->

        <el-form-item>
          <el-button class="shake-btn" type="primary" @click="onSubmit"
            >Start</el-button
          >
          <el-button @click="showSetwat = false">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog
      :append-to-body="true"
      :visible.sync="showImport"
      class="import-dialog"
      width="400px"
    >
      <el-input
        type="textarea"
        :rows="10"
        placeholder="请输入对应的号码和名单(可直接从excel复制)，格式(号码 名字)，导入的名单将代替号码显示在抽奖中。如：
1 张三
2 李四
3 王五
				"
        v-model="listStr"
      ></el-input>
      <div class="footer">
        <el-button size="mini" type="primary" @click="transformList"
          >确定</el-button
        >
        <el-button size="mini" @click="showImport = false">取消</el-button>
      </div>
    </el-dialog>
    <Importphoto
      :visible.sync="showImportphoto"
      @getPhoto="$emit('getPhoto')"
    ></Importphoto>

    <el-dialog
      :visible.sync="showRemoveoptions"
      width="300px"
      class="c-removeoptions"
      :append-to-body="true"
    >
      <el-form ref="form" :model="removeInfo" label-width="80px" size="mini">
        <el-form-item label="重置选项">
          <el-radio-group v-model="removeInfo.type">
            <el-radio border :label="0">重置全部数据</el-radio>
            <el-radio border :label="1">重置抽奖配置</el-radio>
            <!-- <el-radio border :label="2">重置名单</el-radio>
            <el-radio border :label="3">重置照片</el-radio> -->
            <el-radio border :label="4">重置抽奖结果</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="resetConfig">确定重置</el-button>
          <el-button @click="showRemoveoptions = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import {
  clearData,
  removeData,
  configField,
  listField,
  resultField,
  conversionCategoryName
} from '@/helper/index';
import Importphoto from './Importphoto';
import { database, DB_STORE_NAME } from '@/helper/db';

export default {
  data() {
    return {
      // 记录各奖项抽奖次数
      countMap: new Map(),
      showSetwat: false,
      showImport: false,
      showImportphoto: false,
      showRemoveoptions: false,
      removeInfo: { type: 0 },
      form: {
        /**
         * 抽奖类型
         */
        category: '',
        /**
         * 抽取方式 1人 5人 一次性抽完 自定义人数
         */
        mode: 0,
        qty: 1,
        allin: false
      },
      listStr: '',
      // 当前选择奖项类型
      currentCategory: 'fourthPrize'
    };
  },
  props: {
    running: Boolean,
    closeRes: Function
  },
  computed: {
    config: {
      get() {
        return this.$store.state.config;
      }
    },
    // 当前列表数量
    currentList() {
      return this.$store.state.list;
    },
    currentListLen() {
      return this.$store.state.config.number;
    },

    poolRemaining() {
      const awardedCount = Object.values(this.result).reduce(
        (total, resultArray) => total + resultArray.length,
        0
      );
      return this.form.allin
        ? this.currentListLen
        : this.currentListLen - awardedCount;
    },

    // 剩余可抽奖人数
    remain() {
      return (
        this.config[this.form.category] -
        (this.result[this.form.category]
          ? this.result[this.form.category].length
          : 0)
      );
    },

    // 已抽取的结果
    result() {
      return this.$store.state.result;
    },

    // 奖项列表
    categorys() {
      const options = [];
      for (const key in this.config) {
        if (this.config.hasOwnProperty(key)) {
          const item = this.config[key];
          if (item > 0) {
            let name = conversionCategoryName(key);
            name &&
              options.push({
                label: name,
                value: key
              });
          }
        }
      }
      return options;
    }
  },
  components: { Importphoto },
  // data() {
  //   return {

  //   };
  // },
  watch: {
    showRemoveoptions(v) {
      if (!v) {
        this.removeInfo.type = 0;
      }
    }
  },
  methods: {
    // 重置数据
    resetConfig() {
      const type = this.removeInfo.type;
      this.$confirm('此操作将重置所选数据，是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.form.category = '';
          switch (type) {
            case 0:
              clearData();
              this.$store.commit('setClearStore');
              database.clear(DB_STORE_NAME);
              break;
            case 1:
              removeData(configField);
              this.$store.commit('setClearConfig');
              break;
            case 2:
              removeData(listField);
              this.$store.commit('setClearList');
              break;
            case 3:
              database.clear(DB_STORE_NAME);
              this.$store.commit('setClearPhotos');
              break;
            case 4:
              removeData(resultField);
              this.$store.commit('setClearResult');
              break;
            default:
              break;
          }

          this.closeRes && this.closeRes();

          this.showRemoveoptions = false;
          this.$message({
            type: 'success',
            message: '重置成功!'
          });

          this.$emit('refresh');
          this.$nextTick(() => {
            this.$emit('resetConfig');
          });
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消'
          });
        });
    },

    // 立即抽奖
    onSubmit() {
      if (!this.form.category) {
        return this.$message.error('请选择本次抽取的奖项');
      }
      if (this.remain <= 0) {
        return this.$message.error('该奖项剩余人数不足');
      }

      // Check if the pool remaining is less than the number of people to be drawn
      if (this.poolRemaining < this.form.qty) {
        return this.$message.error('奖池剩余人数不足');
      }

      if (this.form.mode === 99) {
        if (this.form.qty <= 0) {
          return this.$message.error('必须输入本次抽取人数');
        }
        if (this.form.qty > this.remain) {
          return this.$message.error('本次抽奖人数已超过本奖项的剩余人数');
        }
      }
      if (this.form.mode === 1 || this.form.mode === 5) {
        if (this.form.mode > this.remain) {
          return this.$message.error('本次抽奖人数已超过本奖项的剩余人数');
        }
      }

      this.showSetwat = false;

      // 记录抽奖次数
      const { category } = this.form;

      const countVal = this.countMap.get(category);
      if (countVal) {
        this.countMap.set(category, countVal + 1);
      } else {
        this.countMap.set(category, 1);
      }

      console.log(this.countMap, '记录抽奖次数');

      // 判断是否为一次性抽完且奖池剩余数量不足
      if (this.form.mode === 0 && this.poolRemaining < this.remain) {
        this.$emit('toggle', {
          ...this.form,
          remain: this.poolRemaining, // 使用奖池剩余人数作为剩余人数
          countMap: this.countMap
        });
      } else {
        this.$emit('toggle', {
          ...this.form,
          remain: this.remain,
          countMap: this.countMap
        });
      }
    },

    // 开始 / 停止
    startHandler() {
      this.$emit('toggle');
      if (!this.running) {
        this.showSetwat = true;
      }
    },

    // 导入名单
    transformList() {
      const { listStr } = this;
      if (!listStr) {
        this.$message.error('没有数据');
      }
      const list = [];
      const rows = listStr.split('\n');
      if (rows && rows.length > 0) {
        rows.forEach(item => {
          const rowList = item.split(/\t|\s/);
          if (rowList.length >= 2) {
            const key = Number(rowList[0].trim());
            const name = rowList[1].trim();
            key &&
              list.push({
                key,
                name
              });
          }
        });
      }
      this.$store.commit('setList', list);

      this.$message({
        message: '保存成功',
        type: 'success'
      });
      this.showImport = false;
      this.$emit('refresh');
      this.$nextTick(() => {
        this.$emit('resetConfig');
      });
    },

    changeMode(e) {
      console.log(e);
      this.form.qty = this.remain;
    }
  }
};
</script>
<style lang="scss">
#tool {
  position: fixed;
  width: 60px;
  top: 80%;
  right: 20px;
  transform: translateY(-50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .el-button + .el-button {
    margin-top: 20px;
    margin-left: 0px;
  }
}
.setwat-dialog {
  .el-dialog {
    border-bottom: 1px solid hsla(0, 0%, 100%, 0.4);
    border-radius: 20px;
    border-right: 1px solid hsla(0, 0%, 100%, 0.4);
    box-shadow: -10px -10px 20px rgba(0, 0, 0, 0.2),
      10px 10px 20px hsla(0, 0%, 100%, 0.1);
    color: hsla(0, 0%, 100%, 0.8);
    position: fixed;
    right: 20px;
    bottom: 20px;
    transform: translate(0%, 150%);
    -ms-transform: translate(0%, 150%);
    -webkit-transform: translate(0%, 150%);
    height: 200px;
    margin: 0;
    // background-image: linear-gradient(
    //   to top left,
    //   rgba(90, 149, 207, 0.7),
    //   rgba(58, 76, 99, 0.9)
    // );
    // height: 400px;
    // overflow: hidden;
    // text-align: center;
    // -webkit-transform: rotate(0deg);
    // transform: rotate(0deg);
    // width: 260px;
    z-index: 10;
  }

  // .el-dialog::after {
  //   background-image: linear-gradient(
  //     to top left,
  //     rgba(90, 149, 207, 0.7),
  //     rgba(58, 76, 99, 0.9)
  //   );
  //   border-radius: 20px;
  //   bottom: 0;
  //   content: '';
  //   -webkit-filter: blur(10px);
  //   filter: blur(10px);
  //   left: 0;
  //   margin: -20px;
  //   position: absolute;
  //   right: 0;
  //   top: 0;
  //   z-index: -1;
  // }
  .colorred {
    color: red;
    font-weight: bold;
  }
  $buttonColor: #35a2fd;
  // .shake-btn {
  //   // width: 160px;
  //   // height: 48px;
  //   border: 0;
  //   border-radius: 6px;
  //   background: $buttonColor;
  //   display: flex;
  //   justify-content: center;
  //   align-items: center;
  //   color: #ffffff;
  //   font-size: 24px;
  //   cursor: pointer;
  //   box-shadow: 0px 10px 20px -10px $buttonColor;
  //   animation: 0.2s ease 0s 1 normal none running show,
  //     1.2s ease 1s infinite normal none running shake;

  //   &:hover {
  //     transform: scale(1.1);
  //   }

  //   @keyframes show {
  //     0% {
  //       transform: scale(0);
  //       opacity: 0;
  //     }
  //     80% {
  //       transform: scale(1.05);
  //       opacity: 1;
  //     }
  //     100% {
  //       transform: scale(1);
  //     }
  //   }

  //   @keyframes shake {
  //     0% {
  //       transform: translate3d(0px, 0px, 0px);
  //     }
  //     10% {
  //       transform: translate3d(-3%, 0px, 0px) rotate3d(0, 0, 1, -5deg);
  //     }
  //     20% {
  //       transform: translate3d(2%, 0px, 0px) rotate3d(0, 0, 1, 3deg);
  //     }
  //     30% {
  //       transform: translate3d(-1%, 0px, 0px) rotate3d(0, 0, 1, -3deg);
  //     }
  //     40% {
  //       transform: translate3d(1%, 0px, 0px) rotate3d(0, 0, 1, 2deg);
  //     }
  //     50% {
  //       transform: translate3d(-1%, 0px, 0px) rotate3d(0, 0, 1, -1deg);
  //     }
  //     60% {
  //       transform: translate3d(0px, 0px, 0px);
  //     }
  //     100% {
  //       transform: translate3d(0px, 0px, 0px);
  //     }
  //   }
  // }
}
.import-dialog {
  .footer {
    height: 50px;
    line-height: 50px;
    text-align: center;
  }
}
.c-removeoptions {
  .el-dialog {
    // height: 290px;
    border-bottom: 1px solid hsla(0, 0%, 100%, 0.4);
    border-radius: 20px;
    border-right: 1px solid hsla(0, 0%, 100%, 0.4);
    box-shadow: -10px -10px 20px rgba(0, 0, 0, 0.2),
      10px 10px 20px hsla(0, 0%, 100%, 0.1);
    color: hsla(0, 0%, 100%, 0.8);
    position: fixed;
    right: 20px;
    bottom: 20px;
    transform: translate(0%, 150%);
    -ms-transform: translate(0%, 150%);
    -webkit-transform: translate(0%, 150%);
    height: 240px;
    margin: 0;
  }
  .el-radio.is-bordered + .el-radio.is-bordered {
    margin-left: 0px;
  }
  .el-radio.is-bordered {
    margin-bottom: 10px;
  }
}
</style>
