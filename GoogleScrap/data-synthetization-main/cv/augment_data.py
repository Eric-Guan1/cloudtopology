import cv2
import numpy as np
import os
from tqdm import tqdm
import random
from skimage.util import random_noise

def noise_Guassian(img):
    img = random_noise(img, mode='gaussian', mean=0, var=0.01, clip=True)
    img = (255*img).astype(np.uint8)
    return img
def noise_SP(img):
    img = random_noise(img, mode='s&p', salt_vs_pepper=0.5, clip=True)
    img = (255*img).astype(np.uint8)
    return img
def guass_blur(img):
    kernel = np.ones((3,3),np.float32)/9
    img = cv2.filter2D(img,-1,kernel)
    return img
def random_crop(img):
    h,w,d = img.shape
    sx,sy = random.randint(0,h//4), random.randint(0,w//4)
    ex,ey = sx + random.randint(h//2,(h//4)*3), sy + random.randint(w//2,(w//4)*3)
    img = img[sx:ex,sy:ey]
    return img
def flip(img):
    h,w,d = img.shape
    for i in range(h):
        for j in range(w//2):
            img[i][j], img[i][w-j-1] = img[i][w-j-1].copy(), img[i][j].copy()
    return img

def noise_augment(img,crop=True,canflip=True,blur=True):
    if (random.random() < 0.5):
        img = noise_Guassian(img)
    else:
        img = noise_SP(img)
    if crop:
        img = random_crop(img)
    if (random.random()<0.5 and canflip):
        img = flip(img)
    if (random.random()<0.5 and blur):
        img = guass_blur(img)
    return img

if __name__=="__main__":
    path = input("Image directory path:")
    newpath = os.path.join(path,"noise_augmented_imgs")
    if not os.path.exists(newpath):
        os.makedirs(newpath)
    supported_formats = ["jpg",'png','webp']
    dir_list = os.listdir(path)
    for i in tqdm(range(len(dir_list))):
        f = dir_list[i]
        if f.split(".")[-1] in supported_formats:
            img = cv2.imread(os.path.join(path,f))
            img = noise_augment(img)
            cv2.imwrite(os.path.join(newpath,f),img)
            