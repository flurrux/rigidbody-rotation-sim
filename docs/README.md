
This folder is named 'docs' instead of 'dist' because that was the easiest way to get it uploaded to github pages.
I didn't want to setup github action and i also didn't want to make an extra branch, which leaves this little hack.

Github gives you two choices:
1. Select the entire branch as the src, but this only works if index.html and index.js are at the root level.
2. Select the 'docs' folder from the branch

That's it. You can't select an arbitrary folder.  
The simplest way was therefore to rename 'dist' into 'docs' which worked nicely.
Not the most elegant but it's totally fine.
