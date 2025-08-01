export interface ResponseTimeData {
  llmResponseTime?: number;
  ttsResponseTime?: number;
  isProcessing: boolean;
}

export class ResponseTimeTracker {
  private llmStartTime?: number;
  private ttsStartTime?: number;
  private currentData: ResponseTimeData = {
    isProcessing: false
  };

  public startLLMRequest() {
    this.llmStartTime = Date.now();
    this.currentData.isProcessing = true;
  }

  public endLLMRequest() {
    if (this.llmStartTime) {
      this.currentData.llmResponseTime = Date.now() - this.llmStartTime;
      this.llmStartTime = undefined;
    }
  }

  public startTTSRequest() {
    this.ttsStartTime = Date.now();
    this.currentData.isProcessing = true;
  }

  public endTTSRequest() {
    if (this.ttsStartTime) {
      this.currentData.ttsResponseTime = Date.now() - this.ttsStartTime;
      this.ttsStartTime = undefined;
    }
  }

  public setProcessing(processing: boolean) {
    this.currentData.isProcessing = processing;
  }

  public getCurrentData(): ResponseTimeData {
    return { ...this.currentData };
  }

  public reset() {
    this.currentData = {
      isProcessing: false
    };
    this.llmStartTime = undefined;
    this.ttsStartTime = undefined;
  }
} 