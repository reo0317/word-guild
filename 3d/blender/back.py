import bpy, sys, math, mathutils
exec(open('pose.py').read().split("shoot('t')")[0].replace("for name, ang in [('front', 0), ('side', 90)]:","for name, ang in [('back', 180), ('side2', -90)]:"))
shoot('t')
