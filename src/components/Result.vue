<template>
  <el-dialog
    :visible="visible"
    @close="$emit('update:visible', false)"
    width="100%"
    class="c-Result"
    :append-to-body="true"
  >
    <div class="dialog-title" slot="title">
      <span :style="{ fontSize: '32px' }">
        Lucky Draw
      </span>
      <span>
        <!-- {{ resultList }} -->
      </span>
      <!-- <span :style="{ fontSize: '14px', color: '#999', marginLeft: '10px' }">
        (点击号码可以删除)
      </span> -->
    </div>
    <div
      v-for="(item, index) in resultList"
      :key="index"
      class="listrow"
      @click="
        event => {
          // deleteRes(event, item);
        }
      "
    >
      <span class="prize-name"> {{ item.name }} </span>
      <div class="prize-value">
        <span v-if="item.value && item.value.length === 0">
          暂未抽奖
        </span>

        <el-tooltip
          v-for="(data, j) in item.value"
          :key="j"
          :data-res="data"
          class="card"
          effect="dark"
          :content="findItem(data).name"
          placement="top-start"
        >
          <div class="info-card">
            <img
              v-if="findItem(data).photo"
              class="info-card__logo"
              :src="findItem(data).photo"
            />
            <div class="info-card__name">{{ findItem(data).compNameEn }}</div>
            <div class="info-card__name">{{ findItem(data).compNameCn }}</div>
          </div>
        </el-tooltip>
      </div>
    </div>
  </el-dialog>
</template>
<script>
import { conversionCategoryName, getDomData } from '@/helper/index';
export default {
  name: 'c-Result',
  props: {
    visible: Boolean
  },
  computed: {
    currentList() {
      return this.$store.state.list;
    },
    result: {
      get() {
        return this.$store.state.result;
      },
      set(val) {
        this.$store.commit('setResult', val);
      }
    },
    resultList() {
      const list = [];
      for (const key in this.result) {
        if (this.result.hasOwnProperty(key)) {
          const element = this.result[key];
          let name = conversionCategoryName(key);
          list.push({
            label: key,
            name,
            value: element
          });
        }
      }
      return list;
    }
  },
  methods: {
    findItem(data) {
      return this.currentList.find(item => {
        return item.key === data;
      });
    },
    deleteRes(event, row) {
      const Index = getDomData(event.target, 'res');
      console.log('惦记删除', Index);
      if (!Index) {
        return;
      }
      this.$confirm('此操作将移除该中奖号码，确认删除?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          if (Index) {
            const result = this.result;
            result[row.label] = this.result[row.label].filter(
              item => item !== Number(Index)
            );
            this.result = result;
            this.$message({
              type: 'success',
              message: '删除成功!'
            });
          }
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消'
          });
        });
    }
  }
};
</script>
<style lang="scss">
.c-Result {
  .el-dialog {
    background: transparent;
  }

  .dialog-title {
    font-family: ShuHeiTi, 'Courier New', Courier, monospace;
    background: linear-gradient(to bottom, #ffffff, #dbe4fe, #ffffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
  .el-dialog__body {
    max-height: 80vh;
    overflow-y: auto;
  }
  .listrow {
    display: flex;
    line-height: 32px;
    margin: 20px 0;

    .prize-name {
      width: 120px;
      font-weight: bold;
      font-family: ShuHeiTi, 'Courier New', Courier, monospace;
      font-size: 20px;
      line-height: 32px;
      background: linear-gradient(to bottom, #ffffff, #dbe4fe, #ffffff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-fill-color: transparent;
    }
    .prize-value {
      flex: 1;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      flex-wrap: wrap;
    }
    .card {
      // display: inline-block;
      // width: 160px;
      // overflow: hidden;
      // text-overflow: ellipsis;
      // white-space: nowrap;
      width: 374px;
      height: 210px;
      padding: 15px;
      line-height: 30px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      border-radius: 4px;
      border: 2px solid #5c7bff;
      // background-color: #f2f2f2;
      background: linear-gradient(to bottom, #222324, #3a4986);
      margin-left: 25px;
      margin-bottom: 15px;
      position: relative;
      cursor: pointer;
      color: #fff;

      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .info-card {
        &__logo {
          width: 160px;
          height: 90px;
        }
        &__name {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 2;
        }
      }
      // &:hover {
      //   &::before {
      //     content: '删除';
      //     width: 100%;
      //     height: 100%;
      //     background-color: #ccc;
      //     position: absolute;
      //     left: 0;
      //     top: 0;
      //     color: red;
      //   }
      // }
    }
  }
}
</style>
