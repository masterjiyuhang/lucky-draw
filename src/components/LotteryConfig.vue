<template>
  <el-dialog
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    width="390px"
    @close="$emit('update:visible', false)"
    class="c-LotteryConfig"
  >
    <div class="c-LotteryConfigtitle" slot="title">
      <span :style="{ color: '#333', fontSize: '16px', marginRight: '20px' }">
        抽奖配置
      </span>
      <el-button size="mini" @click="addLottery">增加奖项</el-button>
      <el-button size="mini" type="primary" @click="onSubmit"
        >保存配置</el-button
      >
      <el-button size="mini" @click="$emit('update:visible', false)"
        >取消</el-button
      >
    </div>
    <div class="container">
      <el-form ref="form" :model="form" size="mini">
        <!-- <el-form-item label="抽奖标题">
          <el-input v-model="form.name"></el-input>
        </el-form-item> -->
        <!-- <el-form-item label="抽奖总人数">
          <el-input
            type="number"
            v-model="form.number"
            :min="1"
            :step="1"
          ></el-input>
        </el-form-item>
        <el-form-item label="一等奖">
          <el-input
            type="number"
            v-model="form.firstPrize"
            :min="0"
            :step="1"
          ></el-input>
        </el-form-item>
        <el-form-item label="二等奖">
          <el-input
            type="number"
            v-model="form.secondPrize"
            :min="0"
            :step="1"
          ></el-input>
        </el-form-item>
        <el-form-item label="三等奖">
          <el-input
            type="number"
            v-model="form.thirdPrize"
            :min="0"
            :step="1"
          ></el-input>
        </el-form-item>
        <el-form-item label="四等奖">
          <el-input
            type="number"
            v-model="form.fourthPrize"
            :min="0"
            :step="1"
          ></el-input>
        </el-form-item> -->
        <el-form-item
          :label="newitem.name"
          v-for="newitem in storeNewLottery"
          :key="newitem.key"
        >
          <el-input
            type="number"
            :min="0"
            :step="1"
            v-model="form[newitem.key]"
            @change="val => onFormItemChange(val, newitem.key)"
          ></el-input>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog
      :visible.sync="showAddLottery"
      :append-to-body="true"
      width="300px"
      class="dialog-showAddLottery"
    >
      <div class="add-title" slot="title">增加奖项</div>
      <el-form ref="newLottery" :model="newLottery" size="mini">
        <el-form-item label="奖项名称">
          <el-input v-model="newLottery.name"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addHandler">增加奖项</el-button>
          <el-button @click="showAddLottery = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </el-dialog>
</template>
<script>
import { setData, getData, configField, resultField } from '@/helper/index';
import { randomNum } from '@/helper/algorithm';
export default {
  name: 'LotteryConfig',
  props: {
    visible: Boolean
  },
  computed: {
    form: {
      get() {
        return this.$store.state.config;
      },
      set(val) {
        // this.$store.commit('setConfig', val);
        return val;
      }
    },
    storeNewLottery() {
      return this.$store.state.newLottery;
    }
  },
  data() {
    return {
      canChangeConfig: true,
      showAddLottery: false,
      newLottery: { name: '' }
    };
  },
  methods: {
    onFormItemChange(val, key) {
      val = Number(val);
      const previousValue = getData(configField)[key];
      const hasResult = getData(resultField)[key].length > 0;
      const isInvalid = previousValue > val;

      console.log(previousValue, val, hasResult);

      if (hasResult && isInvalid) {
        console.log('false ...');
        this.canChangeConfig = false;
        // this.form[key] = previousValue; // 将当前值恢复为上一次的值
      } else {
        console.log('true ....');
        this.canChangeConfig = true;
        this.form[key] = val;
      }
    },
    onSubmit() {
      if (!this.canChangeConfig) {
        this.$message.error('修改的数值不能小于上一次的值');
        return;
      }
      // const previousConfig = getData(configField); // 保存上一次的配置
      // // 检查是否有小于上一次的值的修改
      // const isInvalid = Object.keys(this.form).some(key => {
      //   return this.form[key] < previousConfig[key];
      // });

      // if (isInvalid) {
      //   this.$message.error('修改的数值不能小于上一次的值');
      //   return; // 停止保存配置
      // }

      setData(configField, this.form);
      this.$store.commit('setConfig', this.form);
      this.$emit('update:visible', false);

      this.$message({
        message: '保存成功',
        type: 'success'
      });
      this.$emit('refresh');
      this.$nextTick(() => {
        this.$emit('resetconfig');
      });
    },
    addLottery() {
      this.showAddLottery = true;
    },
    randomField() {
      const str = 'abcdefghijklmnopqrstuvwxyz';
      let fieldStr = '';
      for (let index = 0; index < 10; index++) {
        fieldStr += str.split('')[randomNum(1, 27) - 1];
      }
      return `${fieldStr}${Date.now()}`;
    },
    addHandler() {
      const field = this.randomField();
      const data = {
        key: field,
        name: this.newLottery.name
      };
      this.$store.commit('setNewLottery', data);

      this.showAddLottery = false;
    }
  }
};
</script>
<style lang="scss">
.c-LotteryConfig {
  .el-dialog {
    border-bottom: 1px solid hsla(0, 0%, 100%, 0.4);
    border-radius: 20px;
    border-right: 1px solid hsla(0, 0%, 100%, 0.4);
    box-shadow: -10px -10px 20px rgba(0, 0, 0, 0.2),
      10px 10px 20px hsla(0, 0%, 100%, 0.1);
    color: hsla(0, 0%, 100%, 0.8);
    top: unset;
    transform: none;
    position: fixed;
    right: 30px;
    bottom: 20px;
    height: 200px;
    margin: 0;
  }
  .el-dialog__body {
    height: 340px;
    .container {
      overflow-y: auto;
      padding: 0 10px;
      height: 100px;
    }
  }
}
.dialog-showAddLottery {
  .el-dialog {
    height: 186px;
  }
}
</style>
