// Slider component class
class MiningSlider {
  constructor(sliderSelector) {
    this.slider = document.querySelector(sliderSelector);
    if (!this.slider) return;

    this.wrapper = this.slider.querySelector('.slider-wrapper');
    this.slides = this.slider.querySelectorAll('.slider-slide');
    this.prevBtn = this.slider.querySelector('.slider-prev');
    this.nextBtn = this.slider.querySelector('.slider-next');
    this.dotsContainer = this.slider.querySelector('.slider-dots');

    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.autoSlideInterval = 5000;
    this.timer = null;

    // Touch Swipe properties
    this.startX = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;
    this.isDragging = false;

    this.init();
  }

  init() {
    // Generate dots
    this.dotsContainer.innerHTML = '';
    this.slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `slider-dot w-2 h-2 rounded-full bg-slate-600 transition-all ${idx === 0 ? 'active !bg-indigo-500 !w-4' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', () => {
        this.goToSlide(idx);
        this.resetTimer();
      });
      this.dotsContainer.appendChild(dot);
    });

    // Control events
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prevSlide();
        this.resetTimer();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.nextSlide();
        this.resetTimer();
      });
    }

    // Touch events for Swiping
    this.wrapper.addEventListener('touchstart', (e) => this.touchStart(e));
    this.wrapper.addEventListener('touchmove', (e) => this.touchMove(e));
    this.wrapper.addEventListener('touchend', () => this.touchEnd());

    // Mouse drag events for testing swiping on desktop
    this.wrapper.addEventListener('mousedown', (e) => this.touchStart(e));
    this.wrapper.addEventListener('mousemove', (e) => this.touchMove(e));
    this.wrapper.addEventListener('mouseup', () => this.touchEnd());
    this.wrapper.addEventListener('mouseleave', () => {
      if (this.isDragging) this.touchEnd();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        const rect = this.slider.getBoundingClientRect();
        // Only trigger if slider is visible on viewport
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          this.prevSlide();
          this.resetTimer();
        }
      } else if (e.key === 'ArrowRight') {
        const rect = this.slider.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          this.nextSlide();
          this.resetTimer();
        }
      }
    });

    // Start auto slide
    this.startTimer();
    this.updateSlider();
  }

  goToSlide(index) {
    if (index < 0) {
      this.currentIndex = this.slideCount - 1;
    } else if (index >= this.slideCount) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }
    this.updateSlider();
  }

  prevSlide() {
    this.goToSlide(this.currentIndex - 1);
  }

  nextSlide() {
    this.goToSlide(this.currentIndex + 1);
  }

  updateSlider() {
    // Translate slides
    const translateAmount = -this.currentIndex * 100;
    this.wrapper.style.transform = `translateX(${translateAmount}%)`;

    // Update dots status
    const dots = this.dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      if (idx === this.currentIndex) {
        dot.classList.add('active', '!bg-indigo-500', '!w-4');
        dot.classList.remove('bg-slate-600');
      } else {
        dot.classList.remove('active', '!bg-indigo-500', '!w-4');
        dot.classList.add('bg-slate-600');
      }
    });
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.nextSlide();
    }, this.autoSlideInterval);
  }

  resetTimer() {
    clearInterval(this.timer);
    this.startTimer();
  }

  // Swipe Functions
  touchStart(e) {
    this.isDragging = true;
    this.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    this.wrapper.style.transition = 'none';
  }

  touchMove(e) {
    if (!this.isDragging) return;
    const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    const diff = currentX - this.startX;
    // Calculate preview translate
    const wrapperWidth = this.wrapper.offsetWidth;
    const currentTranslateOffset = (-this.currentIndex * wrapperWidth) + diff;
    this.wrapper.style.transform = `translateX(${currentTranslateOffset}px)`;
  }

  touchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.wrapper.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Determine translation distance
    const wrapperWidth = this.wrapper.offsetWidth;
    const endTranslate = parseFloat(this.wrapper.style.transform.replace('translateX(', '').replace('px)', ''));
    const expectedTranslate = -this.currentIndex * wrapperWidth;
    const distanceMoved = endTranslate - expectedTranslate;

    // Threshold: swipe 20% width to trigger transition
    if (distanceMoved < -wrapperWidth * 0.2) {
      this.nextSlide();
    } else if (distanceMoved > wrapperWidth * 0.2) {
      this.prevSlide();
    } else {
      this.goToSlide(this.currentIndex);
    }
    this.resetTimer();
  }
}

// Initialize Slider when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MiningSlider('#mining-slider');
});
