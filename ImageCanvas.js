import ImageStatic from 'ol/source/ImageStatic';
import ImageCanvas from 'ol/ImageCanvas';
import EventType from 'ol/events/EventType';
import {listen} from 'ol/events';

class Canvas extends ImageStatic {
   constructor(options) {
      super(options);
      this.image_ = new ImageCanvas(options.imageExtent, 1, 1, options.canvas);
      listen(this.image_, EventType.CHANGE, this.handleImageChange, this);
   }
}

export default Canvas;