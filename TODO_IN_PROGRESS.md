## Video CRNN+CTC accuracy debugging - progress log

- [x] Inspected frontend video frame extraction code (`VideoUploadAndProcess.tsx`).
- [x] Inspected backend upload endpoint + preprocessing (`views.py`, `inference.py`).
- [x] Identified likely mismatches: JPEG re-encoding, sampling strategy, possible rotation/canvas issues, crop width variability.

- [ ] (Next) Create concrete patch for frame transfer (JPEG->PNG or quality=1.0) and add optional debug saving of first 10 frames.
- [ ] Run manual debug test: compare `frame_0.jpg` uploaded via image endpoint vs extracted frame.
- [ ] If still low, adjust sampling (motion-based / every N frames) and add rotation/orientation fix.

